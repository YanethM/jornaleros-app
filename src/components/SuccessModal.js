import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Paleta de colores
const COLORS = {
  primary: "#274F66",
  primaryLight: "#3A6B85",
  secondary: "#B6883E",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#274E66",
  textSecondary: "#4A5568",
  textLight: "#718096",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  border: "#E2E8F0",
};

// ✅ SuccessModal con fixes para evitar el error de useInsertionEffect
const SuccessModal = ({ 
  visible, 
  successData, 
  onClose, 
  onViewApplications 
}) => {
  // ✅ Usar useRef en lugar de useState para Animated.Value
  const modalAnimation = useRef(new Animated.Value(0)).current;

  // ✅ Remover modalAnimation de las dependencias ya que es estable
  const startAnimation = useCallback(() => {
    Animated.sequence([
      Animated.timing(modalAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []); // ✅ Sin dependencias ya que modalAnimation es estable

  const closeModal = useCallback(() => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  }, [onClose]); // ✅ Solo onClose como dependencia

  // ✅ useEffect simplificado sin startAnimation como dependencia
  useEffect(() => {
    if (visible) {
      // ✅ Llamar directamente la animación sin dependencias innecesarias
      Animated.timing(modalAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // ✅ Reset animation when not visible
      modalAnimation.setValue(0);
    }
  }, [visible]); // ✅ Solo visible como dependencia

  if (!visible || !successData) return null;

  const { jobTitle, farmName, employerName } = successData;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={closeModal}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: modalAnimation,
              transform: [
                {
                  scale: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}>
          {/* Header con icono de éxito */}
          <View style={styles.header}>
            <View style={styles.successIconContainer}>
              <LinearGradient
                colors={["#10B981", "#34D399"]}
                style={styles.successIconGradient}>
                <Ionicons name="checkmark-circle" size={48} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>¡Postulación Exitosa!</Text>
            <Text style={styles.subtitle}>
              Tu solicitud ha sido enviada correctamente
            </Text>
          </View>

          {/* Información del trabajo */}
          <View style={styles.jobInfo}>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons
                    name="briefcase"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Trabajo</Text>
                  <Text style={styles.infoValue} numberOfLines={2}>
                    {jobTitle}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons
                    name="business"
                    size={20}
                    color={COLORS.secondary}
                  />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Finca</Text>
                  <Text style={styles.infoValue}>{farmName}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="person" size={20} color={COLORS.success} />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Productor</Text>
                  <Text style={styles.infoValue}>{employerName}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Estado de notificación */}
          <View style={styles.notificationStatus}>
            <LinearGradient
              colors={["#F0F9FF", "#E0F2FE"]}
              style={styles.statusGradient}>
              <View style={styles.statusContent}>
                <Ionicons name="mail" size={24} color={COLORS.primary} />
                <View style={styles.statusText}>
                  <Text style={styles.statusTitle}>
                    Notificación Enviada
                  </Text>
                  <Text style={styles.statusDescription}>
                    {employerName} ha sido notificado sobre tu postulación y
                    te contactará pronto.
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Botones de acción */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                closeModal();
                onViewApplications();
              }}>
              <Ionicons name="list" size={20} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>
                Ver Mis Postulaciones
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={closeModal}>
              <LinearGradient
                colors={["#274F66", "#3A6B85"]}
                style={styles.primaryButtonGradient}>
                <Text style={styles.primaryButtonText}>
                  Continuar Explorando
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ✅ Estilos del modal (sin cambios)
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    alignItems: "center",
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: "#F8FAFC",
  },
  successIconContainer: {
    marginBottom: 16,
    borderRadius: 40,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  successIconGradient: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  jobInfo: {
    padding: 24,
  },
  infoCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: "500",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "600",
  },
  notificationStatus: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  statusGradient: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0F2FE",
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actions: {
    padding: 24,
    paddingTop: 0,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}10`,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
});

export default SuccessModal;