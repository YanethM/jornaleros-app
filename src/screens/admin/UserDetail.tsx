import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import ScreenLayoutAdmin from "../../components/ScreenLayoutAdmin";
import Icon from "react-native-vector-icons/MaterialIcons";
import { getUserById } from "../../services/userService";
import CustomTabBarAdmin from "../../components/CustomTabBarAdmin";

const PRIMARY_COLOR = "#284F66";
const SECONDARY_COLOR = "#4A7C94";
const DANGER_COLOR = "#e74c3c";
const SUCCESS_COLOR = "#2ecc71";
const WARNING_COLOR = "#f39c12";
const LIGHT_BACKGROUND = "#f8fafc";

const UserDetail = ({ navigation, route }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { userId } = route.params;

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await getUserById(userId);
      setUser(userData);
    } catch (error) {
      console.error("Error al obtener usuario:", error);
      setError("Error al cargar los datos del usuario");
      Alert.alert("Error", "No se pudo cargar la información del usuario");
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (roleName) => {
    switch (roleName) {
      case "Productor":
        return PRIMARY_COLOR;
      case "Administrador":
        return DANGER_COLOR;
      case "Trabajador":
      default:
        return SECONDARY_COLOR;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No disponible";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const InfoRow = ({ icon, label, value, color = "#64748b" }) => (
    <View style={styles.infoRow}>
      <Icon name={icon} size={20} color={color} style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "No especificado"}</Text>
      </View>
    </View>
  );

  const SectionCard = ({ title, children, icon }) => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Icon name={icon} size={24} color={PRIMARY_COLOR} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  if (loading) {
    return (
      <ScreenLayoutAdmin navigation={navigation}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Cargando perfil del usuario...</Text>
        </View>
      </ScreenLayoutAdmin>
    );
  }

  if (error || !user) {
    return (
      <ScreenLayoutAdmin navigation={navigation}>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={60} color={DANGER_COLOR} />
          <Text style={styles.errorText}>
            {error || "Usuario no encontrado"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchUserData}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </ScreenLayoutAdmin>
    );
  }

  return (
    <ScreenLayoutAdmin navigation={navigation}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={PRIMARY_COLOR} />
          </TouchableOpacity>
          <Text style={styles.title}>Perfil de Usuario</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tarjeta principal del usuario */}
        <View style={styles.userMainCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: `https://i.pravatar.cc/150?u=${user.email}` }}
              style={styles.avatar}
            />
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: user.status ? SUCCESS_COLOR : DANGER_COLOR },
              ]}>
              <Icon
                name={user.status ? "check" : "close"}
                size={16}
                color="white"
              />
            </View>
          </View>

          <View style={styles.userMainInfo}>
            <Text style={styles.userName}>
              {user.name} {user.lastname}
            </Text>
            <Text style={styles.userEmail}>{user.email}</Text>

            <View style={styles.badgeContainer}>
              <View
                style={[
                  styles.roleBadge,
                  { backgroundColor: getRoleColor(user.role?.name) },
                ]}>
                <Text style={styles.roleText}>{user.role?.name}</Text>
              </View>

              <View style={styles.verificationBadge}>
                <Icon
                  name={user.isVerified ? "verified" : "warning"}
                  size={16}
                  color={user.isVerified ? SUCCESS_COLOR : WARNING_COLOR}
                />
                <Text
                  style={[
                    styles.verificationText,
                    { color: user.isVerified ? SUCCESS_COLOR : WARNING_COLOR },
                  ]}>
                  {user.isVerified ? "Verificado" : "No verificado"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Información personal */}
        <SectionCard title="Información Personal" icon="person">
          <InfoRow
            icon="badge"
            label="Documento"
            value={`${user.documentType} ${user.documentId}`}
          />
          <InfoRow icon="phone" label="Teléfono" value={user.phone} />
          <InfoRow
            icon="public"
            label="Nacionalidad"
            value={user.nationality}
          />
        </SectionCard>

        {/* Información de ubicación */}
        <SectionCard title="Ubicación" icon="location-on">
          <InfoRow
            icon="flag"
            label="País"
            value={user.country?.name}
          />
          <InfoRow
            icon="map"
            label="Departamento/Estado"
            value={user.departmentState?.name}
          />
          <InfoRow
            icon="location-city"
            label="Ciudad"
            value={user.city?.name}
          />
        </SectionCard>

        {/* Información de actividad */}
        <SectionCard title="Información de Actividad" icon="schedule">
          <InfoRow
            icon="login"
            label="Último acceso"
            value={formatDate(user.lastLogin)}
          />
          <InfoRow
            icon="access-time"
            label="Última actividad"
            value={formatDate(user.lastActiveAt)}
          />
          <InfoRow
            icon="date-range"
            label="Fecha de registro"
            value={formatDate(user.createdAt)}
          />
          <InfoRow
            icon="update"
            label="Última actualización"
            value={formatDate(user.updatedAt)}
          />
          <InfoRow
            icon="security"
            label="Intentos fallidos de login"
            value={user.failedLoginAttempts?.toString() || "0"}
            color={user.failedLoginAttempts > 0 ? WARNING_COLOR : SUCCESS_COLOR}
          />
          {user.lastFailedLogin && (
            <InfoRow
              icon="warning"
              label="Último intento fallido"
              value={formatDate(user.lastFailedLogin)}
              color={WARNING_COLOR}
            />
          )}
        </SectionCard>

        {/* Perfil de Trabajador */}
        {user.workerProfile && (
          <SectionCard title="Perfil de Trabajador" icon="work">
            <InfoRow
              icon="check-circle"
              label="Disponibilidad"
              value={
                user.workerProfile.availability ? "Disponible" : "No disponible"
              }
              color={
                user.workerProfile.availability ? SUCCESS_COLOR : DANGER_COLOR
              }
            />
            <InfoRow
              icon="toggle-on"
              label="Estado del perfil"
              value={
                user.workerProfile.status ? "Activo" : "Inactivo"
              }
              color={
                user.workerProfile.status ? SUCCESS_COLOR : DANGER_COLOR
              }
            />
            <InfoRow
              icon="trending-up"
              label="Experiencia"
              value={user.workerProfile.experience || "No especificada"}
            />
            <InfoRow
              icon="attach-money"
              label="Tarifa"
              value={
                user.workerProfile.paymentAmount
                  ? `$${user.workerProfile.paymentAmount.toLocaleString()}`
                  : "No especificada"
              }
            />
            <InfoRow
              icon="date-range"
              label="Perfil creado"
              value={formatDate(user.workerProfile.createdAt)}
            />

            {user.workerProfile.skills &&
              user.workerProfile.skills.length > 0 && (
                <View style={styles.skillsContainer}>
                  <Text style={styles.skillsLabel}>Habilidades:</Text>
                  <View style={styles.skillsList}>
                    {user.workerProfile.skills.map((skill, index) => (
                      <View key={index} style={styles.skillChip}>
                        <Text style={styles.skillText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

            {user.workerProfile.interests &&
              user.workerProfile.interests.length > 0 && (
                <View style={styles.skillsContainer}>
                  <Text style={styles.skillsLabel}>Intereses:</Text>
                  <View style={styles.skillsList}>
                    {user.workerProfile.interests.map((interest, index) => (
                      <View key={index} style={styles.interestChip}>
                        <Text style={styles.interestText}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

            {(!user.workerProfile.skills || user.workerProfile.skills.length === 0) && 
             (!user.workerProfile.interests || user.workerProfile.interests.length === 0) && (
              <View style={styles.emptySkillsContainer}>
                <Icon name="info" size={20} color="#64748b" />
                <Text style={styles.emptySkillsText}>
                  No se han agregado habilidades o intereses
                </Text>
              </View>
            )}
          </SectionCard>
        )}

        {/* Perfil de Empleador */}
        {user.employerProfile && (
          <SectionCard title="Perfil de Empleador" icon="business">
            <InfoRow
              icon="domain"
              label="Empresa"
              value={user.employerProfile.companyName}
            />
            <InfoRow
              icon="description"
              label="Descripción"
              value={user.employerProfile.description}
            />
          </SectionCard>
        )}

        {/* Información de seguridad */}
        <SectionCard title="Información de Seguridad" icon="security">
          <InfoRow
            icon="vpn-key"
            label="Token de recuperación"
            value={user.resetPasswordToken ? "Activo" : "Sin token activo"}
            color={user.resetPasswordToken ? WARNING_COLOR : SUCCESS_COLOR}
          />
          {user.resetPasswordExpires && (
            <InfoRow
              icon="schedule"
              label="Expiración del token"
              value={formatDate(user.resetPasswordExpires)}
              color={WARNING_COLOR}
            />
          )}
          <InfoRow
            icon="verified-user"
            label="Código de verificación"
            value={user.verificationCode ? "Pendiente" : "No requerido"}
            color={user.verificationCode ? WARNING_COLOR : SUCCESS_COLOR}
          />
        </SectionCard>

        {/* Botones de acción */}
        <View style={styles.actionButtonsContainer}>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.statusButton,
              { backgroundColor: user.status ? DANGER_COLOR : SUCCESS_COLOR },
            ]}
            onPress={() => {
              Alert.alert(
                user.status ? "Desactivar Usuario" : "Activar Usuario",
                `¿Estás seguro de que quieres ${
                  user.status ? "desactivar" : "activar"
                } este usuario?`,
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Confirmar",
                    onPress: () => {
                      // Aquí llamarías a la función para cambiar el status
                      console.log("Cambiar status del usuario");
                    },
                  },
                ]
              );
            }}>
            <Icon
              name={user.status ? "block" : "check-circle"}
              size={20}
              color="white"
            />
            <Text style={styles.actionButtonText}>
              {user.status ? "Desactivar" : "Activar"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <CustomTabBarAdmin
        state={{ index: 1, routes: [] }}
        navigation={navigation}
      />
    </ScreenLayoutAdmin>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: LIGHT_BACKGROUND,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  scrollContentContainer: {
    paddingBottom: 100, 
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: PRIMARY_COLOR,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    color: PRIMARY_COLOR,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    color: DANGER_COLOR,
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  userMainCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e6f2f8",
  },
  statusBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  userMainInfo: {
    alignItems: "center",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: PRIMARY_COLOR,
    marginBottom: 4,
    textAlign: "center",
  },
  userEmail: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 16,
    textAlign: "center",
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  roleBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  roleText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
  },
  verificationText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: "500",
  },
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: PRIMARY_COLOR,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoIcon: {
    marginRight: 12,
    width: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: PRIMARY_COLOR,
    fontWeight: "500",
  },
  skillsContainer: {
    marginTop: 12,
  },
  skillsLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
    fontWeight: "500",
  },
  skillsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillChip: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  skillText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  interestChip: {
    backgroundColor: SECONDARY_COLOR,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  interestText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  emptySkillsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    marginTop: 8,
  },
  emptySkillsText: {
    marginLeft: 8,
    color: "#64748b",
    fontSize: 14,
    fontStyle: "italic",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  editButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  statusButton: {
    // Color dinámico basado en el status
  },
  actionButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default UserDetail;