import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const { width } = Dimensions.get("window");

const TerrainItem = ({ farm, index, onEdit, onDelete, onViewMore }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const cropType =
    farm.cropTypes && farm.cropTypes.length > 0
      ? farm.cropTypes[0].name
      : farm.cropType;

  const getCropIcon = (type) => {
    const icons = {
      café: "local-cafe",
      cacao: "eco",
      aguacate: "eco",
      default: "grass",
    };
    return icons[type?.toLowerCase()] || icons.default;
  };

  const getGradientColors = (type) => {
    const gradients = {
      café: ["#6F4E37", "#8B5A2B"],
      cacao: ["#5D4037", "#6D4C41"],
      aguacate: ["#2E7D32", "#388E3C"],
      default: ["#43A047", "#66BB6A"],
    };
    return gradients[type?.toLowerCase()] || gradients.default;
  };

  const [startColor, endColor] = getGradientColors(cropType);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onViewMore(farm.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}>
        <View style={styles.card}>
          {/* Image Section with Gradient Overlay */}
          <View style={styles.imageSection}>
            {farm.mediaUrls && farm.mediaUrls.length > 0 ? (
              <Image
                source={{ uri: farm.mediaUrls[0] }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.imagePlaceholder,
                  { backgroundColor: startColor },
                ]}>
                <Icon name={getCropIcon(cropType)} size={40} color="white" />
              </View>
            )}

            <View
              style={[styles.gradientOverlay, { backgroundColor: startColor }]}
            />

            <View style={styles.statusBadge}>
              <Icon name="verified" size={16} color="#4CAF50" />
              <Text style={styles.statusText}>Activo</Text>
            </View>

            <View style={styles.areaBadge}>
              <Text style={styles.areaText}>{farm.area || 0} ha</Text>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.mainInfo}>
              <Text style={styles.farmName} numberOfLines={1}>
                {farm.name}
              </Text>

              <View style={styles.locationContainer}>
                <Icon name="location-on" size={16} color="#757575" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {farm.city}, {farm.state}
                </Text>
              </View>

              <View style={styles.chipContainer}>
                <View
                  style={[styles.chip, { backgroundColor: `${startColor}15` }]}>
                  <Icon
                    name={getCropIcon(cropType)}
                    size={14}
                    color={startColor}
                  />
                  <Text style={[styles.chipText, { color: startColor }]}>
                    {cropType || "Sin cultivo"}
                  </Text>
                </View>

                {farm.owner && (
                  <View style={[styles.chip, { backgroundColor: "#E3F2FD" }]}>
                    <Icon name="person" size={14} color="#1976D2" />
                    <Text style={[styles.chipText, { color: "#1976D2" }]}>
                      {farm.owner.name}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Actions Section */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryAction]}
                onPress={() => onViewMore(farm.id)}>
                <Text style={styles.primaryActionText}>Ver detalles</Text>
                <Icon name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>

              <View style={styles.iconActions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => onEdit(farm.id)}>
                  <Icon name="edit" size={20} color="#757575" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => onDelete(farm.id)}>
                  <Icon name="delete" size={20} color="#E57373" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bottom Accent Line */}
          <View style={[styles.accentLine, { backgroundColor: startColor }]} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  imageSection: {
    height: 180,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    opacity: 0.85,
  },
  statusBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
    marginLeft: 4,
  },
  areaBadge: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  areaText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  content: {
    padding: 20,
  },
  mainInfo: {
    marginBottom: 20,
  },
  farmName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: "#757575",
    marginLeft: 4,
    flex: 1,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1976D2",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    marginRight: 12,
  },
  primaryActionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
  },
  iconActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  accentLine: {
    height: 4,
    width: "100%",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#E0E0E0",
  },
});

export default TerrainItem;
