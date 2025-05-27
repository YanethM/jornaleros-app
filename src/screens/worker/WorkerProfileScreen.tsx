import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  Feather,
} from "@expo/vector-icons";
import ScreenLayoutWorker from "../../components/ScreenLayoutWorker";
import { useAuth } from "../../context/AuthContext";
import {
  addWorkerSkill,
  getWorkerProfile,
  getWorkerReviews,
  getWorkerSkills,
  removeWorkerSkill,
  updateWorkerProfile,
} from "../../services/workerService";
import { getCropType } from "../../services/cropTypeService";

interface WorkerProfile {
  bio: string;
  availability: boolean;
  user: {
    name: string;
    lastname: string;
    email: string;
    phone: string;
    city: string;
    departmentState: string;
    profilePicture?: string;
  };
  totalJobs?: number;
  completedJobs?: number;
  totalEarnings?: number;
}

interface Skill {
  id: string;
  cropType: {
    name: string;
    id: string;
  };
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  employer: {
    user: {
      name: string;
    };
  };
}

const COLORS = {
  primary: "#274E66",
  primaryLight: "#274E78",
  primaryDark: "#3A5A8A",
  secondary: "#FFA630",
  accent: "#4CB944",
  background: "#F8F9FA",
  cardBackground: "#FFFFFF",
  textPrimary: "#274E66",
  textSecondary: "#274E60",
  border: "#E2E8F0",
  success: "#48BB78",
  warning: "#ED8936",
  error: "#F56565",
  star: "#F6AD55",
};

const WorkerProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(
    null
  );
  const [workerSkills, setWorkerSkills] = useState<Skill[]>([]);
  const [workerReviews, setWorkerReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [skillsModalVisible, setSkillsModalVisible] = useState<boolean>(false);
  const [addingSkill, setAddingSkill] = useState<boolean>(false);
  const [reviewsModalVisible, setReviewsModalVisible] =
    useState<boolean>(false);
  const { user, updateUser } = useAuth();
  const [cropTypes, setCropTypes] = useState([]);
  const [skillForm, setSkillForm] = useState({
    cropTypeId: "",
    experienceLevel: "Básico",
    yearsOfExperience: "0",
  });

  const [editForm, setEditForm] = useState({
    bio: "",
    availability: true,
  });

  const [profileStats, setProfileStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    averageRating: 0,
    totalEarnings: 0,
    skillsCount: 0,
  });

  const handleOpenSkillsModal = async () => {
    const loadedCropTypes = await loadCropTypes();
    setSkillsModalVisible(true);
  };

  const loadCropTypes = async () => {
    try {
      const data = await getCropType();
      console.log("Crop Types API response:", JSON.stringify(data));

      let types = [];
      if (data && data.success && Array.isArray(data.data)) {
        types = data.data;
      } else if (data && data.cropTypes && Array.isArray(data.cropTypes)) {
        types = data.cropTypes;
      } else if (Array.isArray(data)) {
        types = data;
      }

      setCropTypes(types);
      return types; // Retornar los tipos para uso posterior
    } catch (error) {
      console.error("Error loading crop types:", error);
      Alert.alert("Error", "No se pudieron cargar los tipos de cultivo");
      return []; // Retornar array vacío en caso de error
    }
  };

  const loadWorkerProfile = async (): Promise<void> => {
    try {
      setLoading(true);
      const workerId = await getWorkerId();

      const [profileResult, skillsResult, reviewsResult] =
        await Promise.allSettled([
          getWorkerProfile(workerId),
          getWorkerSkills(workerId),
          getWorkerReviews(workerId),
        ]);

      const profileData =
        profileResult.status === "fulfilled" ? profileResult.value : null;
      const skillsData =
        skillsResult.status === "fulfilled"
          ? skillsResult.value
          : { skills: [] };
      const reviewsData =
        reviewsResult.status === "fulfilled"
          ? reviewsResult.value
          : { reviews: [] };

      setWorkerProfile(profileData || getDefaultProfile());

      const skillsArray = Array.isArray(skillsData?.skills)
        ? skillsData.skills
        : [];
      setWorkerSkills(skillsArray);

      const reviewsArray = Array.isArray(reviewsData?.reviews)
        ? reviewsData.reviews
        : [];
      setWorkerReviews(reviewsArray);

      setEditForm({
        bio: profileData?.bio || "",
        availability: profileData?.availability !== false,
      });

      const avgRating =
        reviewsArray.length > 0
          ? reviewsArray.reduce((sum, review) => sum + review.rating, 0) /
            reviewsArray.length
          : 0;

      setProfileStats({
        totalJobs: profileData?.totalJobs || 0,
        completedJobs: profileData?.completedJobs || 0,
        averageRating: avgRating,
        totalEarnings: profileData?.totalEarnings || 0,
        skillsCount: skillsArray.length,
      });
    } catch (error) {
      console.error("Error cargando perfil:", error);
      setWorkerProfile(getDefaultProfile());
      setWorkerSkills([]);
      setWorkerReviews([]);
      setEditForm(getDefaultEditForm());
      setProfileStats(getDefaultStats());

      Alert.alert(
        "Error de Conexión",
        "No se pudo cargar el perfil. Verifica tu conexión a internet e inténtalo de nuevo.",
        [
          { text: "Reintentar", onPress: () => loadWorkerProfile() },
          { text: "Cancelar", style: "cancel" },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const getWorkerId = async (): Promise<string> => {
    if (!user || !user.workerProfile || !user.workerProfile.id) {
      throw new Error("Perfil de trabajador no encontrado");
    }

    const workerId = user.workerProfile.id;
    const objectIdRegex = /^[a-f\d]{24}$/i;

    if (
      typeof workerId !== "string" ||
      workerId.length !== 24 ||
      !objectIdRegex.test(workerId)
    ) {
      throw new Error("ID de trabajador no válido");
    }

    return workerId;
  };

  const getDefaultProfile = (): WorkerProfile => ({
    bio: "",
    availability: true,
    user: {
      name: user?.name || "",
      lastname: user?.lastname || "",
      email: user?.email || "",
      phone: user?.phone || "",
      city: "",
      departmentState: "",
    },
  });

  const getDefaultEditForm = () => ({
    bio: "",
    availability: true,
  });

  const getDefaultStats = () => ({
    totalJobs: 0,
    completedJobs: 0,
    averageRating: 0,
    totalEarnings: 0,
    skillsCount: 0,
  });

  const handleUpdateProfile = async (): Promise<void> => {
    try {
      const workerId = await getWorkerId();
      const updateData = {
        bio: editForm.bio,
        availability: editForm.availability,
      };

      await updateWorkerProfile(workerId, updateData);
      setEditModalVisible(false);
      Alert.alert("Éxito", "Perfil actualizado correctamente");
      loadWorkerProfile();
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      Alert.alert("Error", "No se pudo actualizar el perfil");
    }
  };

  const handleAddSkill = async (): Promise<void> => {
    // Prevenir múltiples ejecuciones
    if (addingSkill) return;

    try {
      setAddingSkill(true);
      const workerId = await getWorkerId();

      if (!skillForm.cropTypeId) {
        throw new Error("Debes seleccionar un tipo de cultivo");
      }

      await addWorkerSkill(workerId, {
        cropTypeId: skillForm.cropTypeId,
        experienceLevel: skillForm.experienceLevel,
        yearsOfExperience: parseInt(skillForm.yearsOfExperience) || 0,
      });

      setSkillsModalVisible(false);
      setSkillForm({
        cropTypeId: "",
        experienceLevel: "Básico",
        yearsOfExperience: "0",
      });

      Alert.alert("Éxito", "Habilidad agregada correctamente");
      await loadWorkerProfile(); // Añadir await aquí también
    } catch (error) {
      console.error("Error agregando habilidad:", error);
      Alert.alert("Error", error.message || "No se pudo agregar la habilidad");
    } finally {
      setAddingSkill(false);
    }
  };

  const handleRemoveSkill = async (skillId: string): Promise<void> => {
    try {
      console.log("Removing skill with ID:", skillId);
      const result = await removeWorkerSkill(skillId);
      console.log("Remove skill result:", result);
      Alert.alert("Éxito", "Habilidad removida");
      await loadWorkerProfile();
    } catch (error) {
      console.error("Error removiendo habilidad:", error);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadWorkerProfile();
    setRefreshing(false);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await loadCropTypes();
      await loadWorkerProfile();
    };
    loadInitialData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando tu perfil...</Text>
      </View>
    );
  }

  return (
    <ScreenLayoutWorker navigation={navigation}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }>
        {/* Header con foto de perfil */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={styles.header}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {workerProfile?.user?.profilePicture ? (
                <Image
                  source={{ uri: workerProfile.user.profilePicture }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={48} color="white" />
                </View>
              )}
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.name}>
                {workerProfile?.user?.name} {workerProfile?.user?.lastname}
              </Text>
              <Text style={styles.profession}>Trabajador Agrícola</Text>

              <View style={styles.availabilityContainer}>
                <View
                  style={[
                    styles.availabilityDot,
                    workerProfile?.availability
                      ? styles.available
                      : styles.notAvailable,
                  ]}
                />
                <Text style={styles.availabilityText}>
                  {workerProfile?.availability ? "Disponible" : "No disponible"}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profileStats.totalJobs}</Text>
            <Text style={styles.statLabel}>Trabajos</Text>
          </View>

          <View style={styles.statSeparator} />

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profileStats.completedJobs}</Text>
            <Text style={styles.statLabel}>Completados</Text>
          </View>

          <View style={styles.statSeparator} />

          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {profileStats.averageRating.toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Calificación</Text>
          </View>

          <View style={styles.statSeparator} />

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profileStats.skillsCount}</Text>
            <Text style={styles.statLabel}>Habilidades</Text>
          </View>
        </View>

        {/* Información personal */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons
              name="person-outline"
              size={24}
              color={COLORS.primary}
            />
            <Text style={styles.cardTitle}>Información Personal</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditModalVisible(true)}>
              <Feather name="edit" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoItem}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={COLORS.textSecondary}
            />
            <Text style={styles.infoText}>
              {workerProfile?.user?.email || "No especificado"}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons
              name="call-outline"
              size={20}
              color={COLORS.textSecondary}
            />
            <Text style={styles.infoText}>
              {workerProfile?.user?.phone || "No especificado"}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons
              name="location-outline"
              size={20}
              color={COLORS.textSecondary}
            />
            <Text style={styles.infoText}>
              {workerProfile?.user?.city || "No especificado"},{" "}
              {workerProfile?.user?.departmentState || ""}
            </Text>
          </View>
        </View>

        {/* Sección "Sobre mí" */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="document-text-outline"
              size={24}
              color={COLORS.primary}
            />
            <Text style={styles.cardTitle}>Sobre mí</Text>
          </View>

          <Text style={styles.bioText}>
            {workerProfile?.bio ||
              "Este trabajador no ha agregado una descripción todavía."}
          </Text>
        </View>

        {/* Habilidades */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="construct-outline"
              size={24}
              color={COLORS.primary}
            />
            <Text style={styles.cardTitle}>Mis Habilidades</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setSkillsModalVisible(true)}>
              <Ionicons name="add" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {workerSkills.length > 0 ? (
            <View style={styles.skillsContainer}>
              {workerSkills.map((skill, index) => (
                <View
                  key={skill.id || index.toString()}
                  style={styles.skillItem}>
                  <View style={styles.skillInfo}>
                    <Ionicons name="leaf" size={20} color={COLORS.accent} />
                    <Text style={styles.skillName}>
                      {skill.cropType?.name || "Habilidad"}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveSkill(skill.id)}>
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={COLORS.error}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="alert-circle-outline"
                size={40}
                color={COLORS.textSecondary}
              />
              <Text style={styles.emptyText}>No hay habilidades agregadas</Text>
              <TouchableOpacity
                style={styles.addSkillButton}
                onPress={handleOpenSkillsModal}>
                <Text style={styles.addSkillButtonText}>Agregar Habilidad</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Reseñas */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome name="star-o" size={24} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Mis Reseñas</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => setReviewsModalVisible(true)}>
              <Text style={styles.viewAllButtonText}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {workerReviews.length > 0 ? (
            <>
              <View style={styles.ratingSummary}>
                <Text style={styles.ratingValue}>
                  {profileStats.averageRating.toFixed(1)}
                </Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FontAwesome
                      key={star}
                      name={
                        star <= Math.round(profileStats.averageRating)
                          ? "star"
                          : "star-o"
                      }
                      size={16}
                      color={COLORS.star}
                    />
                  ))}
                </View>
                <Text style={styles.ratingCount}>
                  ({workerReviews.length} reseñas)
                </Text>
              </View>

              <FlatList
                data={workerReviews.slice(0, 2)}
                keyExtractor={(item, index) => item.id || index.toString()}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewerName}>
                        {item.employer?.user?.name || "Usuario anónimo"}
                      </Text>
                      <View style={styles.reviewStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FontAwesome
                            key={star}
                            name={star <= item.rating ? "star" : "star-o"}
                            size={14}
                            color={COLORS.star}
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.reviewText}>
                      {item.comment || "Sin comentario"}
                    </Text>
                    <Text style={styles.reviewDate}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              />
            </>
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome
                name="star-o"
                size={40}
                color={COLORS.textSecondary}
              />
              <Text style={styles.emptyText}>No hay reseñas aún</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de edición de perfil */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={4}
                  placeholder="Cuéntanos sobre ti..."
                  value={editForm.bio}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, bio: text })
                  }
                />
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Disponibilidad</Text>
                <TouchableOpacity
                  style={[
                    styles.switchButton,
                    editForm.availability
                      ? styles.switchButtonActive
                      : styles.switchButtonInactive,
                  ]}
                  onPress={() =>
                    setEditForm({
                      ...editForm,
                      availability: !editForm.availability,
                    })
                  }>
                  <Text style={styles.switchText}>
                    {editForm.availability ? "Disponible" : "No disponible"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdateProfile}>
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de agregar habilidades */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={skillsModalVisible}
        onRequestClose={() => setSkillsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Habilidad</Text>
              <TouchableOpacity onPress={() => setSkillsModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tipo de Cultivo</Text>
                <View style={styles.cropTypeSelector}>
                  {cropTypes.map((crop) => {
                    const isSelected =
                      skillForm.cropTypeId === crop.id.toString();
                    return (
                      <TouchableOpacity
                        key={crop.id}
                        style={[
                          styles.cropTypeButton,
                          isSelected && styles.cropTypeButtonSelected,
                        ]}
                        onPress={() =>
                          setSkillForm({
                            ...skillForm,
                            cropTypeId: crop.id.toString(),
                          })
                        }>
                        <Text
                          style={[
                            styles.cropTypeButtonText,
                            isSelected && styles.cropTypeButtonTextSelected,
                          ]}>
                          {crop.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.experienceLevelContainer}>
                {["Básico", "Intermedio", "Avanzado"].map((level) => {
                  const isSelected = skillForm.experienceLevel === level;
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.experienceLevelButton,
                        isSelected && styles.experienceLevelButtonSelected,
                      ]}
                      onPress={() =>
                        setSkillForm({
                          ...skillForm,
                          experienceLevel: level,
                        })
                      }>
                      <Text
                        style={[
                          styles.experienceLevelButtonText,
                          isSelected &&
                            styles.experienceLevelButtonTextSelected,
                        ]}>
                        {level}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Años de Experiencia</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Ej: 3"
                  value={skillForm.yearsOfExperience}
                  onChangeText={(text) =>
                    setSkillForm({
                      ...skillForm,
                      yearsOfExperience: text,
                    })
                  }
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (!skillForm.cropTypeId || addingSkill) &&
                    styles.confirmButtonDisabled,
                ]}
                onPress={handleAddSkill}
                disabled={!skillForm.cropTypeId || addingSkill}>
                <Text style={styles.confirmButtonText}>
                  {addingSkill ? "Agregando..." : "Confirmar Habilidad"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de reseñas */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reviewsModalVisible}
        onRequestClose={() => setReviewsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.reviewsModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Todas mis reseñas</Text>
              <TouchableOpacity onPress={() => setReviewsModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={workerReviews}
              keyExtractor={(item, index) => item.id || index.toString()}
              contentContainerStyle={styles.modalContent}
              renderItem={({ item }) => (
                <View style={styles.fullReviewItem}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>
                      {item.employer?.user?.name || "Usuario anónimo"}
                    </Text>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FontAwesome
                          key={star}
                          name={star <= item.rating ? "star" : "star-o"}
                          size={16}
                          color={COLORS.star}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewText}>
                    {item.comment || "Sin comentario"}
                  </Text>
                  <Text style={styles.reviewDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <FontAwesome
                    name="star-o"
                    size={40}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.emptyText}>No hay reseñas aún</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </ScreenLayoutWorker>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  cropTypeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  cropTypeButton: {
    padding: 10,
    margin: 4,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cropTypeButtonSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  cropTypeButtonText: {
    color: COLORS.textPrimary,
  },
  experienceLevelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  experienceLevelButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  experienceLevelButtonSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  experienceLevelButtonText: {
    color: COLORS.textPrimary,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    paddingVertical: 35,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "white",
  },
  cropTypeButtonTextSelected: {
    color: "white", // Texto blanco cuando está seleccionado
    fontWeight: "600",
  },

  // Estilos mejorados para los botones de nivel de experiencia
  experienceLevelButtonTextSelected: {
    color: "white", // Texto blanco cuando está seleccionado
    fontWeight: "600",
  },

  // Mejorar el estilo del botón deshabilitado
  confirmButtonDisabled: {
    backgroundColor: COLORS.border,
    opacity: 0.6,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  profession: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
  },
  availabilityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  availabilityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  available: {
    backgroundColor: COLORS.success,
  },
  notAvailable: {
    backgroundColor: COLORS.error,
  },
  availabilityText: {
    fontSize: 14,
    color: "white",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: -30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  statSeparator: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  editButton: {
    padding: 4,
  },
  addButton: {
    padding: 4,
  },
  viewAllButton: {
    padding: 4,
  },
  viewAllButtonText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginLeft: 12,
    flex: 1,
  },
  bioText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  skillsContainer: {
    marginTop: 8,
  },
  skillItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  skillInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  skillName: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  ratingSummary: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  ratingValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: "row",
    marginRight: 8,
  },
  ratingCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  fullReviewItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  reviewStars: {
    flexDirection: "row",
  },
  reviewText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  addSkillButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  addSkillButtonText: {
    color: "white",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  reviewsModal: {
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  modalContent: {
    paddingBottom: 20,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  switchButton: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  switchButtonActive: {
    backgroundColor: COLORS.success,
  },
  switchButtonInactive: {
    backgroundColor: COLORS.error,
  },
  switchText: {
    color: "white",
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    flex: 1,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
  },
  cropItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cropIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cropName: {
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
  },
});

export default WorkerProfileScreen;
