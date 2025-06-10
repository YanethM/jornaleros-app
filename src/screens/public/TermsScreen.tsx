// screens/Terms.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import CustomHeaderNoAuth from "../../components/CustomHeaderNoAuth";

const Terms = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <CustomHeaderNoAuth navigation={navigation} />
      
      <View style={styles.subHeader}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#284F66" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Términos y Condiciones</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Icon name="agriculture" size={48} color="#284F66" style={styles.heroIcon} />
          <Text style={styles.appName}>Jornaleando</Text>
          <Text style={styles.heroSubtext}>Conectamos el campo con su fuerza laboral</Text>
        </View>

        <Text style={styles.lastUpdated}>
          Última actualización: 29 de mayo, 2025
        </Text>

        <Text style={styles.sectionTitle}>1. Aceptación de Términos</Text>
        <Text style={styles.paragraph}>
          Al registrarte y utilizar Jornaleando, ya sea como <Text style={styles.highlight}>Productor</Text> o <Text style={styles.highlight}>Trabajador</Text>, aceptas estar sujeto a estos Términos y Condiciones. Si no estás de acuerdo con alguno de estos términos, no utilices nuestra plataforma.
        </Text>

        <Text style={styles.sectionTitle}>2. Descripción del Servicio</Text>
        <Text style={styles.paragraph}>
          Jornaleando es una plataforma digital que conecta productores agrícolas con trabajadores especializados en cultivos de <Text style={styles.highlight}>sacha inchi, miel y cacao</Text>. Facilitamos el encuentro entre la oferta y demanda de trabajo agrícola, proporcionando herramientas para la gestión de ofertas laborales, comunicación y coordinación de trabajos.
        </Text>

        <Text style={styles.sectionTitle}>3. Tipos de Usuario</Text>
        
        <Text style={styles.subsectionTitle}>3.1 Productores</Text>
        <Text style={styles.paragraph}>
          Los productores pueden publicar ofertas de trabajo, especificar condiciones laborales, fechas, ubicación y remuneración. Son responsables de proporcionar información veraz y actualizada sobre sus necesidades de mano de obra.
        </Text>

        <Text style={styles.subsectionTitle}>3.2 Trabajadores</Text>
        <Text style={styles.paragraph}>
          Los trabajadores pueden explorar y postularse a ofertas de trabajo que se adapten a su ubicación, disponibilidad y experiencia. Deben proporcionar información precisa sobre sus habilidades y disponibilidad.
        </Text>

        <Text style={styles.sectionTitle}>4. Registro y Verificación</Text>
        <Text style={styles.paragraph}>
          Para utilizar la plataforma, debes registrarte proporcionando información precisa y completa. Nos reservamos el derecho de verificar la identidad de los usuarios para garantizar la seguridad de la comunidad. Eres responsable de mantener actualizada tu información de perfil.
        </Text>

        <Text style={styles.sectionTitle}>5. Publicación de Ofertas de Trabajo</Text>
        <Text style={styles.paragraph}>
          Los productores deben publicar ofertas claras y precisas, incluyendo: tipo de cultivo, ubicación exacta, fechas de trabajo, tareas específicas, remuneración acordada y condiciones especiales. Las ofertas falsas o engañosas están prohibidas.
        </Text>

        <Text style={styles.sectionTitle}>6. Pagos y Transacciones</Text>
        <Text style={styles.paragraph}>
          Jornaleando facilita la conexión entre productores y trabajadores, pero no procesa pagos directamente. Los acuerdos de pago se establecen directamente entre las partes. Recomendamos documentar todos los acuerdos y cumplir con las leyes laborales vigentes en Colombia.
        </Text>

        <Text style={styles.sectionTitle}>7. Responsabilidades de los Usuarios</Text>
        <Text style={styles.paragraph}>
          Todos los usuarios deben cumplir con las leyes laborales colombianas, respetar los acuerdos establecidos, mantener comunicación respetuosa y reportar cualquier problema o comportamiento inapropiado. No toleramos discriminación, acoso o actividades ilegales.
        </Text>

        <Text style={styles.sectionTitle}>8. Seguridad y Privacidad</Text>
        <Text style={styles.paragraph}>
          Protegemos tu información personal según nuestra Política de Privacidad. Sin embargo, cuando contactes con otros usuarios, tu información de contacto puede ser compartida para facilitar la coordinación del trabajo. Nunca compartas información financiera sensible a través de la plataforma.
        </Text>

        <Text style={styles.sectionTitle}>9. Limitación de Responsabilidad</Text>
        <Text style={styles.paragraph}>
          Jornaleando actúa como intermediario digital. No somos responsables por disputas laborales, accidentes de trabajo, incumplimientos de pago o cualquier problema que surja entre productores y trabajadores. Recomendamos a todos los usuarios tomar las precauciones necesarias.
        </Text>

        <Text style={styles.sectionTitle}>10. Contenido y Conducta</Text>
        <Text style={styles.paragraph}>
          Está prohibido publicar contenido ofensivo, discriminatorio, falso o que viole las leyes. Los usuarios que incumplan estas normas pueden ser suspendidos o eliminados de la plataforma. Nos reservamos el derecho de moderar y eliminar contenido inapropiado.
        </Text>

        <Text style={styles.sectionTitle}>11. Modificaciones</Text>
        <Text style={styles.paragraph}>
          Podemos actualizar estos términos para mejorar el servicio o cumplir con nuevas regulaciones. Te notificaremos sobre cambios importantes. El uso continuado de la aplicación después de las modificaciones constituye tu aceptación.
        </Text>

        <Text style={styles.sectionTitle}>12. Ley Aplicable</Text>
        <Text style={styles.paragraph}>
          Estos términos se rigen por las leyes de la República de Colombia. Cualquier disputa se resolverá en los tribunales competentes de Colombia, específicamente en la jurisdicción donde opera principalmente la plataforma.
        </Text>

        <View style={styles.contactSection}>
          <Icon name="support-agent" size={24} color="#284F66" style={styles.contactIcon} />
          <Text style={styles.contactInfo}>
            ¿Tienes preguntas sobre estos términos? Contáctanos a través de la sección de Contacto en la aplicación o escríbenos a jornaleando.arauca@gmail.com
          </Text>
        </View>

        <Text style={styles.finalNote}>
          Gracias por ser parte de la comunidad Jornaleando y contribuir al desarrollo del sector agrícola colombiano.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#284F66",
    textAlign: "center",
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 25,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  heroIcon: {
    marginBottom: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#284F66",
    marginBottom: 5,
  },
  heroSubtext: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
  lastUpdated: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    fontStyle: "italic",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#284F66",
    marginBottom: 10,
    marginTop: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#284F66",
    marginBottom: 8,
    marginTop: 15,
    marginLeft: 10,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 15,
  },
  highlight: {
    fontWeight: "600",
    color: "#284F66",
  },
  contactSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 30,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  contactIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  contactInfo: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: "#555",
  },
  finalNote: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: "italic",
    color: "#284F66",
    textAlign: "center",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
});

export default Terms;