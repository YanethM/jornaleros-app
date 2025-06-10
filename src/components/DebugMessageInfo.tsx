// components/DebugMessageInfo.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: "#6366F1",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#475569",
  textLight: "#64748B",
  border: "#E2E8F0",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
};

interface DebugMessageInfoProps {
  user: any;
  workers: any[];
  selectedWorkers: string[];
  currentUserId: string;
  message: string;
  title: string;
  visible?: boolean;
}

const DebugMessageInfo: React.FC<DebugMessageInfoProps> = ({
  user,
  workers,
  selectedWorkers,
  currentUserId,
  message,
  title,
  visible = false,
}) => {
  const [expanded, setExpanded] = useState(visible);

  if (!__DEV__) {
    return null; // Solo mostrar en desarrollo
  }

  const selectedWorkerObjects = workers.filter(w => selectedWorkers.includes(w.id));

  const validateWorkerData = (worker: any) => {
    const issues = [];
    
    if (!worker.id) issues.push("❌ worker.id faltante");
    if (!worker.user) issues.push("❌ worker.user faltante");
    if (!worker.user?.id) issues.push("❌ worker.user.id faltante");
    if (!worker.user?.name) issues.push("⚠️ worker.user.name faltante");
    if (!worker.user?.lastname) issues.push("⚠️ worker.user.lastname faltante");
    if (!worker.user?.email) issues.push("⚠️ worker.user.email faltante");
    
    return {
      isValid: issues.length === 0,
      issues,
    };
  };

  const exportDebugData = () => {
    const debugData = {
      timestamp: new Date().toISOString(),
      user: {
        id: user?.id,
        hasEmployerProfile: !!user?.employerProfile,
        fullUserObject: user,
      },
      currentUserId,
      messageData: {
        content: message,
        title,
        hasContent: !!message.trim(),
        hasTitle: !!title.trim(),
      },
      workers: {
        total: workers.length,
        selected: selectedWorkers.length,
        selectedWorkerIds: selectedWorkers,
        workersData: workers.map(w => ({
          id: w.id,
          userId: w.user?.id,
          userName: w.user?.name,
          userLastname: w.user?.lastname,
          userEmail: w.user?.email,
          validation: validateWorkerData(w),
        })),
        selectedWorkersValidation: selectedWorkerObjects.map(w => ({
          workerId: w.id,
          userId: w.user?.id,
          name: `${w.user?.name} ${w.user?.lastname}`,
          validation: validateWorkerData(w),
        })),
      },
    };

    console.log('🐛 DEBUG DATA EXPORT:', JSON.stringify(debugData, null, 2));
    
    Alert.alert(
      "Debug Data",
      "Los datos de debug han sido exportados a la consola. Revisa los logs para copiar la información completa.",
      [{ text: "OK" }]
    );
  };

  if (!expanded) {
    return (
      <TouchableOpacity
        style={styles.collapsedContainer}
        onPress={() => setExpanded(true)}
      >
        <Ionicons name="bug" size={16} color={COLORS.warning} />
        <Text style={styles.collapsedText}>Debug Info</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bug" size={20} color={COLORS.warning} />
          <Text style={styles.title}>🐛 Debug Message Info</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={exportDebugData}
          >
            <Ionicons name="download" size={16} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setExpanded(false)}
          >
            <Ionicons name="close" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Usuario Actual</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>ID:</Text>
            <Text style={[styles.value, !user?.id && styles.errorValue]}>
              {user?.id || "❌ FALTANTE"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Current User ID:</Text>
            <Text style={[styles.value, !currentUserId && styles.errorValue]}>
              {currentUserId || "❌ FALTANTE"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Match:</Text>
            <Text style={[styles.value, user?.id !== currentUserId && styles.warningValue]}>
              {user?.id === currentUserId ? "✅ OK" : "⚠️ NO COINCIDEN"}
            </Text>
          </View>
        </View>

        {/* Message Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 Datos del Mensaje</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Contenido:</Text>
            <Text style={[styles.value, !message.trim() && styles.errorValue]}>
              {message.trim() || "❌ VACÍO"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Título:</Text>
            <Text style={styles.value}>
              {title.trim() || "Sin título"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Longitud:</Text>
            <Text style={styles.value}>
              {message.length}/1000 caracteres
            </Text>
          </View>
        </View>

        {/* Workers Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Trabajadores</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Total:</Text>
            <Text style={styles.value}>{workers.length}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Seleccionados:</Text>
            <Text style={[styles.value, selectedWorkers.length === 0 && styles.errorValue]}>
              {selectedWorkers.length || "❌ NINGUNO"}
            </Text>
          </View>
        </View>

        {/* Selected Workers Details */}
        {selectedWorkerObjects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Trabajadores Seleccionados</Text>
            {selectedWorkerObjects.map((worker, index) => {
              const validation = validateWorkerData(worker);
              return (
                <View key={worker.id} style={styles.workerItem}>
                  <View style={styles.workerHeader}>
                    <Text style={styles.workerName}>
                      #{index + 1} {worker.user?.name} {worker.user?.lastname}
                    </Text>
                    <Text style={[
                      styles.validationStatus,
                      validation.isValid ? styles.successValue : styles.errorValue
                    ]}>
                      {validation.isValid ? "✅ OK" : "❌ ERROR"}
                    </Text>
                  </View>
                  
                  <View style={styles.workerDetails}>
                    <Text style={styles.detailText}>
                      Worker ID: {worker.id || "❌ FALTANTE"}
                    </Text>
                    <Text style={styles.detailText}>
                      User ID: {worker.user?.id || "❌ FALTANTE"}
                    </Text>
                    <Text style={styles.detailText}>
                      Email: {worker.user?.email || "❌ FALTANTE"}
                    </Text>
                  </View>

                  {validation.issues.length > 0 && (
                    <View style={styles.issuesContainer}>
                      <Text style={styles.issuesTitle}>Problemas:</Text>
                      {validation.issues.map((issue, idx) => (
                        <Text key={idx} style={styles.issueText}>
                          {issue}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* API Payload Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📡 Vista previa del payload</Text>
          {selectedWorkerObjects.map((worker, index) => {
            const payload = {
              content: message.trim(),
              receiverId: worker.user?.id,
              ...(title.trim() && { title: title.trim() }),
            };
            
            return (
              <View key={worker.id} style={styles.payloadItem}>
                <Text style={styles.payloadTitle}>
                  Para: {worker.user?.name} {worker.user?.lastname}
                </Text>
                <Text style={styles.payloadCode}>
                  {JSON.stringify(payload, null, 2)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  collapsedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  collapsedText: {
    marginLeft: 8,
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '600',
  },
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    margin: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.warning + '40',
    maxHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.warning + '10',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 12,
    color: COLORS.text,
    fontFamily: 'monospace',
    flex: 2,
    textAlign: 'right',
  },
  errorValue: {
    color: COLORS.error,
    fontWeight: '700',
  },
  warningValue: {
    color: COLORS.warning,
    fontWeight: '700',
  },
  successValue: {
    color: COLORS.success,
    fontWeight: '700',
  },
  workerItem: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  validationStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  workerDetails: {
    marginBottom: 8,
  },
  detailText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  issuesContainer: {
    backgroundColor: COLORS.error + '10',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
  },
  issuesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.error,
    marginBottom: 4,
  },
  issueText: {
    fontSize: 11,
    color: COLORS.error,
    marginBottom: 2,
  },
  payloadItem: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  payloadTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  payloadCode: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    backgroundColor: COLORS.surface,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

export default DebugMessageInfo;