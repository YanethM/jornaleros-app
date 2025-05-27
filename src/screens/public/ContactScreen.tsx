import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  StatusBar,
  Image
} from "react-native";
import CustomHeaderNoAuth from "../../components/CustomHeaderNoAuth";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ContactNavigationProp } from "../../navigation/types";

interface ContactScreenProps {
  navigation: ContactNavigationProp;
}

const ContactScreen: React.FC<ContactScreenProps> = ({ navigation }) => {
  const handleEmail = () => {
    Linking.openURL('mailto:info@agroapp.com');
  };

  const handlePhone = () => {
    Linking.openURL('tel:+573001234567');
  };

  const handleLocation = () => {
    Linking.openURL('https://maps.google.com/?q=Bogotá,Colombia');
  };

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
        <Text style={styles.headerTitle}>Contacto</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Icon name="support-agent" size={60} color="#284F66" style={styles.heroIcon} />
          <Text style={styles.heroText}>¿Necesitas ayuda?</Text>
          <Text style={styles.heroSubtext}>Estamos aquí para asistirte</Text>
        </View>
        
        <View style={styles.cardContainer}>
          <TouchableOpacity style={styles.contactCard} onPress={handleEmail}>
            <View style={styles.iconContainer}>
              <Icon name="email" size={32} color="#284F66" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Correo electrónico</Text>
              <Text style={styles.contactValue}>info@agroapp.com</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handlePhone}>
            <View style={styles.iconContainer}>
              <Icon name="phone" size={32} color="#284F66" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Teléfono</Text>
              <Text style={styles.contactValue}>+57 300 123 4567</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleLocation}>
            <View style={styles.iconContainer}>
              <Icon name="location-on" size={32} color="#284F66" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Dirección</Text>
              <Text style={styles.contactValue}>Calle 123 #45-67, Bogotá</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.hoursCard}>
          <Text style={styles.hoursTitle}>Horario de atención</Text>
          <View style={styles.hourRow}>
            <Text style={styles.dayLabel}>Lunes a Viernes:</Text>
            <Text style={styles.timeText}>8:00 AM - 6:00 PM</Text>
          </View>
          <View style={styles.hourRow}>
            <Text style={styles.dayLabel}>Sábados:</Text>
            <Text style={styles.timeText}>9:00 AM - 1:00 PM</Text>
          </View>
          <View style={styles.hourRow}>
            <Text style={styles.dayLabel}>Domingos y festivos:</Text>
            <Text style={styles.timeText}>Cerrado</Text>
          </View>
        </View>
        
        <View style={styles.socialSection}>
          <Text style={styles.socialTitle}>Síguenos en redes sociales</Text>
          <View style={styles.socialIcons}>
            <TouchableOpacity style={styles.socialButton}>
              <Icon name="facebook" size={28} color="#284F66" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Icon name="twitter" size={28} color="#284F66" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Icon name="language" size={28} color="#284F66" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Icon name="inbox" size={28} color="#284F66" />
            </TouchableOpacity>
          </View>
        </View>
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
    marginBottom: 30,
    paddingBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA'
  },
  heroIcon: {
    marginBottom: 15,
  },
  heroText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#284F66",
    marginBottom: 5,
  },
  heroSubtext: {
    fontSize: 16,
    color: "#666",
  },
  cardContainer: {
    marginBottom: 25,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0F4F8",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#284F66",
  },
  hoursCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  hoursTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#284F66",
    marginBottom: 15,
    textAlign: 'center',
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dayLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  timeText: {
    fontSize: 16,
    color: "#333",
  },
  socialSection: {
    alignItems: 'center',
    marginTop: 10,
  },
  socialTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#284F66",
    marginBottom: 15,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0F4F8",
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  }
});

export default ContactScreen;