import { ActivityIndicator, Text, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const PRIMARY_COLOR = "#284F66";
const SECONDARY_COLOR = "#4A7C94";
const COLORS = {
  primary: PRIMARY_COLOR,
  secondary: SECONDARY_COLOR,
  background: "#F5F5F5",
  text: "#333",
  placeholder: "#999",
  info: "#2563eb",
  success: "#059669",
  error: "#DC2626",
  warning: "#D97706",
};

const EnhancedFarmInfoCard = ({
  farmInfo,
  farmCropTypes,
  selectedCropTypeId,
  availablePhasesForSelectedCrop,
  selectedPhaseId,
  loading,
  optimizedData,
}) => {
  if (loading) {
    return (
      <View style={styles.farmInfoContainer}>
        <ActivityIndicator size="small" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>
          Cargando información de la finca...
        </Text>
      </View>
    );
  }

  if (!farmInfo || !farmInfo.name) {
    return null;
  }

  const getLocationValue = (field) => {
    if (!farmInfo) return "No especificado";

    const directValue = farmInfo[field];
    if (typeof directValue === "string") return directValue;
    if (directValue?.name) return directValue.name;

    const locationValue = farmInfo.locationInfo?.[field];
    if (typeof locationValue === "string") return locationValue;
    if (locationValue?.name) return locationValue.name;

    return "No especificado";
  };

  const villageName = farmInfo.village || getLocationValue("village");
  const cityName = getLocationValue("city");
  const departmentName = getLocationValue("department");
  const countryName = getLocationValue("country");

  const selectedCropType = farmCropTypes.find(
    (ct) => ct.id === selectedCropTypeId
  );

  const isOptimizedData = optimizedData && optimizedData.cultivos;
  const dataSourceInfo = isOptimizedData
    ? {
        source: "API Optimizada",
        icon: "check-circle",
        color: COLORS.success,
        description: `Datos cargados con la nueva API optimizada. ${optimizedData.resumen.totalCultivos} cultivos, ${optimizedData.resumen.totalFasesActivas} fases activas.`
      }
    : {
        source: "Datos de Finca",
        icon: "info",
        color: COLORS.info,
        description: "Usando datos directos de la finca seleccionada."
      };

  return (
    <>
      <View style={styles.farmInfoContainer}>
        <View style={styles.farmInfoHeader}>
          <Icon name="agriculture" size={24} color={PRIMARY_COLOR} />
          <Text style={styles.farmInfoTitle}>{farmInfo.name}</Text>
          <View style={styles.farmInfoBadge}>
            <Text style={styles.farmInfoBadgeText}>
              {farmCropTypes.length} cultivo{farmCropTypes.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <View style={styles.farmInfoCard}>
          <View style={styles.farmInfoSection}>
            <Icon name={dataSourceInfo.icon} size={20} color={dataSourceInfo.color} />
            <Text style={styles.farmInfoSectionTitle}>Fuente de Datos</Text>
          </View>
          
          <View style={[styles.dataSourceCard, { borderColor: `${dataSourceInfo.color}30`, backgroundColor: `${dataSourceInfo.color}08` }]}>
            <View style={styles.dataSourceHeader}>
              <Icon name={dataSourceInfo.icon} size={16} color={dataSourceInfo.color} />
              <Text style={[styles.dataSourceTitle, { color: dataSourceInfo.color }]}>
                {dataSourceInfo.source}
              </Text>
            </View>
            <Text style={styles.dataSourceDescription}>
              {dataSourceInfo.description}
            </Text>
            
            {isOptimizedData && (
              <View style={styles.optimizedStatsContainer}>
                <View style={styles.optimizedStat}>
                  <Text style={styles.optimizedStatValue}>{optimizedData.resumen.totalCultivos}</Text>
                  <Text style={styles.optimizedStatLabel}>Cultivos</Text>
                </View>
                <View style={styles.optimizedStat}>
                  <Text style={styles.optimizedStatValue}>{optimizedData.resumen.totalFasesActivas}</Text>
                  <Text style={styles.optimizedStatLabel}>Fases Activas</Text>
                </View>
                <View style={styles.optimizedStat}>
                  <Text style={styles.optimizedStatValue}>{optimizedData.resumen.cultivosConFases || optimizedData.resumen.totalCultivos}</Text>
                  <Text style={styles.optimizedStatLabel}>Con Fases</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.farmInfoCard}>
          <View style={styles.farmInfoSection}>
            <Icon name="location-on" size={20} color={SECONDARY_COLOR} />
            <Text style={styles.farmInfoSectionTitle}>Ubicación</Text>
          </View>

          <View style={styles.locationGrid}>
            <View style={styles.locationItem}>
              <Icon name="public" size={16} color="#666" />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>País</Text>
                <Text style={styles.locationValue}>{countryName}</Text>
              </View>
            </View>

            <View style={styles.locationItem}>
              <Icon name="map" size={16} color="#666" />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Departamento</Text>
                <Text style={styles.locationValue}>{departmentName}</Text>
              </View>
            </View>

            <View style={styles.locationItem}>
              <Icon name="location-city" size={16} color="#666" />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Ciudad</Text>
                <Text style={styles.locationValue}>{cityName}</Text>
              </View>
            </View>

            <View style={styles.locationItem}>
              <Icon name="home" size={16} color="#666" />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Vereda</Text>
                <Text style={styles.locationValue}>{villageName}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.farmInfoCard}>
          <View style={styles.farmInfoSection}>
            <Icon name="grass" size={20} color={SECONDARY_COLOR} />
            <Text style={styles.farmInfoSectionTitle}>
              Cultivos Disponibles ({farmCropTypes.length})
            </Text>
          </View>

          {isOptimizedData && (
            <View style={styles.optimizedInfoBanner}>
              <Icon name="speed" size={16} color={COLORS.success} />
              <Text style={styles.optimizedInfoText}>
                Cultivos y fases cargados con API optimizada
              </Text>
            </View>
          )}

          <View style={styles.cropTypesContainer}>
            {farmCropTypes.map((cropType, index) => {
              let additionalInfo = null;
              if (isOptimizedData) {
                const cultivoOptimizado = optimizedData.cultivos.find(
                  ({ cultivo }) => cultivo.id === cropType.id
                );
                additionalInfo = cultivoOptimizado || null;
              }

              return (
                <View
                  key={cropType.id}
                  style={[
                    styles.cropTypeCard,
                    selectedCropTypeId === cropType.id && styles.selectedCropTypeCard,
                  ]}
                >
                  <View style={styles.cropTypeHeader}>
                    <Icon
                      name="eco"
                      size={16}
                      color={selectedCropTypeId === cropType.id ? PRIMARY_COLOR : "#666"}
                    />
                    <Text
                      style={[
                        styles.cropTypeName,
                        selectedCropTypeId === cropType.id && styles.selectedCropTypeName,
                      ]}
                    >
                      {cropType.name}
                    </Text>
                    
                    {additionalInfo && (
                      <View style={styles.optimizedBadge}>
                        <Text style={styles.optimizedBadgeText}>OPT</Text>
                      </View>
                    )}
                    
                    {selectedCropTypeId === cropType.id && (
                      <Icon name="check-circle" size={16} color={PRIMARY_COLOR} />
                    )}
                  </View>

                  <View style={styles.phasesPreview}>
                    <Text style={styles.phasesPreviewText}>
                      {cropType.phasesCount || 0} fase{(cropType.phasesCount || 0) !== 1 ? "s" : ""} disponible{(cropType.phasesCount || 0) !== 1 ? "s" : ""}
                    </Text>
                    
                    {additionalInfo && (
                      <Text style={styles.phasesOptimizedInfo}>
                        ✅ {additionalInfo.totalFases} fases de API optimizada
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {selectedCropType && availablePhasesForSelectedCrop.length > 0 && (
          <View style={styles.farmInfoCard}>
            <View style={styles.farmInfoSection}>
              <Icon name="timeline" size={20} color={SECONDARY_COLOR} />
              <Text style={styles.farmInfoSectionTitle}>
                Fases Disponibles para {selectedCropType.name}
              </Text>
            </View>
            
            <View style={styles.phaseInfoNote}>
              <Icon name="info" size={16} color={COLORS.info} />
              <Text style={styles.phaseInfoNoteText}>
                {availablePhasesForSelectedCrop.length > 0 && availablePhasesForSelectedCrop[0].source === "optimized-api"
                  ? `✅ Fases cargadas con API optimizada para ${selectedCropType.name}.`
                  : availablePhasesForSelectedCrop.length > 0 && availablePhasesForSelectedCrop[0].source === "cultivation-phase-service-fallback"
                  ? `🔄 Fases específicas del cultivo ${selectedCropType.name} (método de respaldo).`
                  : `📍 Fases disponibles para el cultivo ${selectedCropType.name}.`}
              </Text>
            </View>
            
            <View style={styles.phasesContainer}>
              {availablePhasesForSelectedCrop.map((phase, index) => (
                <View
                  key={phase.id}
                  style={[
                    styles.phaseCard,
                    selectedPhaseId === phase.id && styles.selectedPhaseCard,
                  ]}
                >
                  <View style={styles.phaseCardHeader}>
                    <View
                      style={[
                        styles.phaseCircle,
                        selectedPhaseId === phase.id && styles.selectedPhaseCircle,
                      ]}
                    >
                      <Text
                        style={[
                          styles.phaseNumber,
                          selectedPhaseId === phase.id && styles.selectedPhaseNumber,
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.phaseInfo}>
                      <Text
                        style={[
                          styles.phaseName,
                          selectedPhaseId === phase.id && styles.selectedPhaseName,
                        ]}
                      >
                        {phase.name}
                      </Text>
                      {phase.description && (
                        <Text style={styles.phaseDescription}>
                          {phase.description}
                        </Text>
                      )}
                      {phase.estimatedDuration && (
                        <Text style={styles.phaseDuration}>
                          Duración estimada: {phase.estimatedDuration} días
                        </Text>
                      )}
                      <Text style={styles.phaseSource}>
                        {phase.source === "optimized-api"
                          ? "✅ API Optimizada"
                          : phase.source === "cultivation-phase-service-fallback"
                          ? "🔄 Servicio Específico (Fallback)"
                          : "📍 Fase de la finca"}
                      </Text>
                    </View>
                    {selectedPhaseId === phase.id && (
                      <Icon name="check-circle" size={20} color={PRIMARY_COLOR} />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.farmInfoCard}>
          <View style={styles.farmInfoSection}>
            <Icon name="assessment" size={20} color={SECONDARY_COLOR} />
            <Text style={styles.farmInfoSectionTitle}>Estadísticas</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon name="grass" size={20} color={SECONDARY_COLOR} />
              <Text style={styles.statValue}>{farmInfo.plantCount || 0}</Text>
              <Text style={styles.statLabel}>Plantas Total</Text>
            </View>

            <View style={styles.statItem}>
              <Icon name="square-foot" size={20} color={SECONDARY_COLOR} />
              <Text style={styles.statValue}>{farmInfo.size || 0}</Text>
              <Text style={styles.statLabel}>Hectáreas</Text>
            </View>

            <View style={styles.statItem}>
              <Icon name="spa" size={20} color={SECONDARY_COLOR} />
              <Text style={styles.statValue}>{farmCropTypes.length}</Text>
              <Text style={styles.statLabel}>
                Tipo{farmCropTypes.length !== 1 ? "s" : ""} de Cultivo
              </Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  farmInfoContainer: {
    padding: 16,
    gap: 16,
  },
  loadingText: {
    marginTop: 8,
    color: PRIMARY_COLOR,
    textAlign: "center",
  },
  farmInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  farmInfoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
  },
  farmInfoBadge: {
    backgroundColor: SECONDARY_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: "auto",
  },
  farmInfoBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  farmInfoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  farmInfoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  farmInfoSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: PRIMARY_COLOR,
  },
  locationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "48%",
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: "#666",
  },
  locationValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  cropTypesContainer: {
    gap: 8,
  },
  cropTypeCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
  },
  selectedCropTypeCard: {
    backgroundColor: "#e8f4fc",
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
  },
  cropTypeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cropTypeName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  selectedCropTypeName: {
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
  phasesPreview: {
    marginTop: 4,
    marginLeft: 24,
  },
  phasesPreviewText: {
    fontSize: 12,
    color: "#666",
  },
  phasesContainer: {
    gap: 8,
  },
  phaseCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
  },
  selectedPhaseCard: {
    backgroundColor: "#e8f4fc",
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
  },
  phaseCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  phaseCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedPhaseCircle: {
    backgroundColor: PRIMARY_COLOR,
  },
  phaseNumber: {
    fontSize: 12,
    color: "#666",
  },
  selectedPhaseNumber: {
    color: "white",
  },
  phaseInfo: {
    flex: 1,
  },
  phaseName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  selectedPhaseName: {
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
  phaseDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  phaseDuration: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    fontStyle: "italic",
  },
  phaseSource: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
  },
  phaseInfoNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0f9ff",
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  phaseInfoNoteText: {
    fontSize: 12,
    color: COLORS.info,
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: SECONDARY_COLOR,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  dataSourceCard: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  dataSourceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  dataSourceTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  dataSourceDescription: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 16,
    marginBottom: 8,
  },
  optimizedStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  optimizedStat: {
    alignItems: "center",
  },
  optimizedStatValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.success,
  },
  optimizedStatLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
  },
  optimizedInfoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.success}08`,
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    gap: 6,
  },
  optimizedInfoText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: "500",
  },
  optimizedBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  optimizedBadgeText: {
    fontSize: 8,
    color: "#fff",
    fontWeight: "bold",
  },
  phasesOptimizedInfo: {
    fontSize: 10,
    color: COLORS.success,
    fontStyle: "italic",
    marginTop: 2,
  },
});

export default EnhancedFarmInfoCard;