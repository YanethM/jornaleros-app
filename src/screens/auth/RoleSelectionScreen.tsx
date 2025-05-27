// src/screens/auth/RoleSelectionScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: "#274F66",
  secondary: "#B6883E",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#1A202C",
  textSecondary: "#4A5568",
  textLight: "#718096",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  border: "#E2E8F0",
};

export default function RoleSelectionScreen({ navigation }) {
  const handleRoleSelection = (role) => {
    Alert.alert(
      'Rol seleccionado',
      `Has seleccionado el rol de ${role}. Por favor, completa tu perfil.`,
      [
        {
          text: 'OK',
          onPress: () => {
            // Aquí puedes navegar a la pantalla de completar perfil
            // o actualizar el rol del usuario
            console.log(`Rol seleccionado: ${role}`);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Selecciona tu rol</Text>
          <Text style={styles.subtitle}>
            Para continuar, necesitamos saber qué tipo de usuario eres
          </Text>
        </View>

        <View style={styles.roleOptions}>
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleRoleSelection('trabajador')}
          >
            <View style={[styles.roleIcon, { backgroundColor: `${COLORS.success}15` }]}>
              <Ionicons name="person-add" size={48} color={COLORS.success} />
            </View>
            <Text style={styles.roleTitle}>Soy Trabajador</Text>
            <Text style={styles.roleDescription}>
              Busco oportunidades de trabajo en el sector agrícola
            </Text>
            <View style={styles.roleFeatures}>
              <Text style={styles.featureText}>• Buscar ofertas de trabajo</Text>
              <Text style={styles.featureText}>• Postularme a empleos</Text>
              <Text style={styles.featureText}>• Gestionar mi perfil</Text>
              <Text style={styles.featureText}>• Ver mis postulaciones</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleRoleSelection('empleador')}
          >
            <View style={[styles.roleIcon, { backgroundColor: `${COLORS.primary}15` }]}>
              <Ionicons name="business" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.roleTitle}>Soy Empleador</Text>
            <Text style={styles.roleDescription}>
              Ofrezco oportunidades de trabajo en mi finca o empresa
            </Text>
            <View style={styles.roleFeatures}>
              <Text style={styles.featureText}>• Crear ofertas de trabajo</Text>
              <Text style={styles.featureText}>• Buscar trabajadores</Text>
              <Text style={styles.featureText}>• Gestionar fincas</Text>
              <Text style={styles.featureText}>• Ver postulaciones</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Podrás cambiar tu rol más tarde en la configuración de tu perfil
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  roleOptions: {
    flex: 1,
    gap: 20,
  },
  roleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
  },
  roleIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  roleFeatures: {
    alignSelf: 'stretch',
  },
  featureText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
});