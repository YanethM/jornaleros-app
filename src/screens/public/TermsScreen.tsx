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
        <Text style={styles.lastUpdated}>
          Última actualización: 20 de mayo, 2025
        </Text>

        <Text style={styles.sectionTitle}>1. Aceptación de Términos</Text>
        <Text style={styles.paragraph}>
          Al acceder y utilizar esta aplicación, usted acepta estar sujeto a
          estos Términos y Condiciones de uso. Si no está de acuerdo con
          alguno de estos términos, no utilice esta aplicación.
        </Text>

        <Text style={styles.sectionTitle}>2. Descripción del Servicio</Text>
        <Text style={styles.paragraph}>
          Nuestra aplicación proporciona herramientas para la gestión de
          terrenos agrícolas, incluyendo el registro de cultivos, seguimiento
          de fases de crecimiento y administración de recursos. El servicio se
          proporciona "tal cual" y "según disponibilidad".
        </Text>

        <Text style={styles.sectionTitle}>3. Registro de Usuario</Text>
        <Text style={styles.paragraph}>
          Para utilizar ciertas funciones de la aplicación, debe registrarse y
          proporcionar información precisa y completa. Usted es responsable de
          mantener la confidencialidad de su contraseña y cuenta, y de todas
          las actividades que ocurran bajo su cuenta.
        </Text>

        <Text style={styles.sectionTitle}>4. Privacidad</Text>
        <Text style={styles.paragraph}>
          Su privacidad es importante para nosotros. Nuestra Política de
          Privacidad explica cómo recopilamos, usamos y protegemos la
          información que usted nos proporciona. Al utilizar nuestra
          aplicación, usted acepta nuestras prácticas de privacidad.
        </Text>

        <Text style={styles.sectionTitle}>5. Uso Aceptable</Text>
        <Text style={styles.paragraph}>
          Usted acepta no utilizar la aplicación para ningún propósito ilegal
          o prohibido por estos términos. No debe intentar obtener acceso no
          autorizado a nuestros sistemas o redes.
        </Text>

        <Text style={styles.sectionTitle}>6. Contenido del Usuario</Text>
        <Text style={styles.paragraph}>
          Al subir contenido a nuestra aplicación, usted nos otorga una
          licencia mundial, no exclusiva y libre de regalías para usar,
          reproducir y distribuir dicho contenido en relación con el servicio.
        </Text>

        <Text style={styles.sectionTitle}>
          7. Limitación de Responsabilidad
        </Text>
        <Text style={styles.paragraph}>
          En ningún caso seremos responsables por daños directos, indirectos,
          incidentales, especiales o consecuentes que resulten del uso o la
          imposibilidad de usar nuestros servicios.
        </Text>

        <Text style={styles.sectionTitle}>8. Modificaciones</Text>
        <Text style={styles.paragraph}>
          Nos reservamos el derecho de modificar estos términos en cualquier
          momento. Las modificaciones entrarán en vigor inmediatamente después
          de su publicación. El uso continuado de la aplicación después de
          dichas modificaciones constituirá su aceptación de los nuevos
          términos.
        </Text>

        <Text style={styles.sectionTitle}>9. Ley Aplicable</Text>
        <Text style={styles.paragraph}>
          Estos términos se regirán e interpretarán de acuerdo con las leyes
          de Colombia, sin dar efecto a ningún principio de conflicto de
          leyes.
        </Text>

        <Text style={styles.contactInfo}>
          Si tiene alguna pregunta sobre estos Términos y Condiciones, por
          favor contáctenos a través de la sección de Contacto en la
          aplicación.
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
  lastUpdated: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#284F66",
    marginBottom: 10,
    marginTop: 20,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 15,
  },
  contactInfo: {
    marginTop: 30,
    fontSize: 16,
    lineHeight: 24,
    fontStyle: "italic",
    color: "#555",
  },
});

export default Terms;