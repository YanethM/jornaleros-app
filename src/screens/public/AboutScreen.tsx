// src/screens/public/AboutScreen.tsx
import React from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import CustomHeaderNoAuth from "../../components/CustomHeaderNoAuth";
import { AboutNavigationProp } from "../../navigation/types";

interface AboutScreenProps {
  navigation: AboutNavigationProp;
}

const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  const handleTutorialPress = () => {
    navigation.navigate("Tutorial");
  };

  return (
    <View style={styles.container}>
      <CustomHeaderNoAuth navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.title}>Acerca de</Text>
        <Text style={styles.text}>
          Esta es una aplicación de gestión agrícola que permite administrar fincas,
          empleados y ofertas de trabajo de manera eficiente.
        </Text>
        <Text style={styles.text}>
          Nuestra misión es digitalizar y simplificar los procesos administrativos
          en el sector agrícola.
        </Text>
        <Text style={styles.text}>Versión 1.0.0</Text>
        
        <TouchableOpacity
          style={styles.onboardingButton}
          onPress={handleTutorialPress}
        >
          <Text style={styles.onboardingButtonText}>Ver Tutorial</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    padding: 20,
    flexGrow: 1,
    alignItems: 'center', 
    justifyContent: 'center', 
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#284F66",
    textAlign: 'center', 
  },
  text: {
    fontSize: 16,
    marginBottom: 15,
    lineHeight: 24,
    color: "#666",
    textAlign: 'center', 
    paddingHorizontal: 20,
    maxWidth: 400, 
  },
  onboardingButton: {
    backgroundColor: "#284F66",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  onboardingButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AboutScreen;