import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const PRIMARY_COLOR = "#284F66";
const SECONDARY_COLOR = "#4A7C94";

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case "Activo":
        return { color: "#4CAF50", bgColor: "#E8F5E9", text: "Activa" };
      case "En_curso":
        return { color: "#FF9800", bgColor: "#FFF3E0", text: "En Curso" };
      case "Finalizado":
        return { color: "#E57373", bgColor: "#FFEBEE", text: "Finalizada" };
      default:
        return { color: "#9E9E9E", bgColor: "#F5F5F5", text: status };
    }
  };

  const config = getStatusConfig(status);

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
      <Text style={[styles.statusText, { color: config.color }]}>
        {config.text}
      </Text>
    </View>
  );
};

// Componente principal del Card
const ModernJobOfferCard = ({ jobOffer, onPress }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatLocation = (displayLocation) => {
    if (!displayLocation) return "Ubicación no especificada";
    const { country, department, city, village } = displayLocation;
    
    // Construir la ubicación completa omitiendo valores vacíos
    const locationParts = [
      village && village !== "No especificado" ? village : null,
      city && city !== "No especificado" ? city : null,
      department && department !== "No especificado" ? department : null,
      country && country !== "No especificado" ? country : null,
    ].filter(Boolean);
    
    return locationParts.length > 0 ? locationParts.join(', ') : "Ubicación no especificada";
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(jobOffer)}
      activeOpacity={0.7}
    >
      {/* Header del Card */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {jobOffer.title || 'Oferta de trabajo'}
          </Text>
          <View style={styles.farmInfo}>
            <Icon name="business" size={14} color="#666" />
            <Text style={styles.farmLabel}>Terreno/Finca:</Text>
            <Text style={styles.farmName} numberOfLines={1}>
              {jobOffer.farmInfo?.name || jobOffer.farmName || 'Sin nombre'}
            </Text>
          </View>
        </View>
        <StatusBadge status={jobOffer.status} />
      </View>

      {/* Información destacada */}
      <View style={styles.highlightedInfo}>
        <View style={styles.cropInfo}>
          <View style={styles.cropBadge}>
            <Icon name="eco" size={16} color="#4CAF50" />
            <Text style={styles.cropText}>
              {jobOffer.cropTypeName}
            </Text>
          </View>
          <View style={styles.phaseBadge}>
            <Icon name="schedule" size={16} color="#FF9800" />
            <Text style={styles.phaseText}>
              {jobOffer.phaseName}
            </Text>
          </View>
        </View>
      </View>

      {/* Información secundaria */}
      <View style={styles.secondaryInfo}>
        <View style={styles.infoRow}>
          <Icon name="location-on" size={16} color="#666" />
          <Text style={styles.infoText} numberOfLines={1}>
            {formatLocation(jobOffer.displayLocation)}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Icon name="attach-money" size={16} color="#666" />
          <Text style={styles.infoText}>
            {formatCurrency(jobOffer.salary)}/día
          </Text>
        </View>

        {jobOffer.applicationsCount > 0 && (
          <View style={styles.infoRow}>
            <Icon name="people" size={16} color="#666" />
            <Text style={styles.infoText}>
              {jobOffer.applicationsCount} aplicacion{jobOffer.applicationsCount !== 1 ? 'es' : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Footer con fechas y beneficios */}
      <View style={styles.cardFooter}>
        <View style={styles.dateInfo}>
          <Text style={styles.dateText}>
            {new Date(jobOffer.startDate).toLocaleDateString('es-CO', {
              day: '2-digit',
              month: 'short'
            })} - {new Date(jobOffer.endDate).toLocaleDateString('es-CO', {
              day: '2-digit',
              month: 'short'
            })}
          </Text>
        </View>
        
        {(jobOffer.foodCost > 0 || jobOffer.lodgingCost > 0) && (
          <View style={styles.benefitsInfo}>
            {jobOffer.foodCost > 0 && (
              <View style={styles.benefitChip}>
                <Icon name="restaurant" size={12} color="#4CAF50" />
                <Text style={styles.benefitText}>Comida</Text>
              </View>
            )}
            {jobOffer.lodgingCost > 0 && (
              <View style={styles.benefitChip}>
                <Icon name="home" size={12} color="#284F66" />
                <Text style={styles.benefitText}>Hospedaje</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Indicador de acción */}
      <Icon name="chevron-right" size={24} color="#CCC" style={styles.chevron} />
    </TouchableOpacity>
  );
};

// Componente de lista optimizada
const ModernJobOfferList = ({ jobOffers, onPressItem, refreshControl }) => {
  const renderItem = ({ item }) => (
    <ModernJobOfferCard jobOffer={item} onPress={onPressItem} />
  );

  return (
    <FlatList
      data={jobOffers}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    position: 'relative',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: PRIMARY_COLOR,
    marginBottom: 4,
  },
  farmInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  farmLabel: {
    fontSize: 13,
    color: SECONDARY_COLOR,
    fontWeight: "500",
  },
  farmName: {
    fontSize: 14,
    color: SECONDARY_COLOR,
    fontWeight: "600",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  highlightedInfo: {
    marginBottom: 12,
  },
  cropInfo: {
    flexDirection: "row",
    gap: 8,
  },
  cropBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  cropText: {
    fontSize: 13,
    color: "#2E7D32",
    fontWeight: "600",
  },
  phaseBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  phaseText: {
    fontSize: 13,
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
  secondaryInfo: {
    marginBottom: 12,
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  dateInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 13,
    color: SECONDARY_COLOR,
    fontWeight: "500",
  },
  benefitsInfo: {
    flexDirection: "row",
    gap: 6,
  },
  benefitChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
  },
  benefitText: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },
  chevron: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -12,
  },
});

export { ModernJobOfferCard, ModernJobOfferList };