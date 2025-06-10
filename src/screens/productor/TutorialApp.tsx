import React, { useState } from "react";
import { View, Image, TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";
import ScreenLayout from "../../components/ScreenLayout";
import CustomTabBar from "../../components/CustomTabBar";

const { width, height } = Dimensions.get('window');

const images = {
  dashboard: require("../../../assets/tutorial/1.png"),
  terrenos: require("../../../assets/tutorial/2.png"),
  mensajes: require("../../../assets/tutorial/3.png"),
  menuprincipal: require("../../../assets/tutorial/4.png"),
  ofertas: require("../../../assets/tutorial/5.png"),
  detalle_oferta: require("../../../assets/tutorial/6.png"),
  buscar_trabajadores: require("../../../assets/tutorial/7.png"),
};

const tutorialSteps = [
  {
    key: 'dashboard',
    title: 'Dashboard',
    description: 'Bienvenido a tu panel principal donde podrás ver un resumen de toda tu actividad.',
    image: images.dashboard
  },
  {
    key: 'terrenos',
    title: 'Gestión de Terrenos',
    description: 'Administra y visualiza todos tus terrenos de manera fácil y organizada.',
    image: images.terrenos
  },
  {
    key: 'mensajes',
    title: 'Centro de Mensajes',
    description: 'Mantente comunicado con trabajadores y clientes desde un solo lugar.',
    image: images.mensajes
  },
  {
    key: 'menuprincipal',
    title: 'Menú Principal',
    description: 'Accede rápidamente a todas las funciones de la aplicación.',
    image: images.menuprincipal
  },
  {
    key: 'ofertas',
    title: 'Gestión de Ofertas',
    description: 'Crea, edita y administra todas tus ofertas de trabajo.',
    image: images.ofertas
  },
  {
    key: 'detalle_oferta',
    title: 'Detalles de Oferta',
    description: 'Visualiza información completa y gestiona cada oferta individual.',
    image: images.detalle_oferta
  },
  {
    key: 'buscar_trabajadores',
    title: 'Búsqueda de Trabajadores',
    description: 'Encuentra los trabajadores perfectos para tus proyectos.',
    image: images.buscar_trabajadores
  }
];

const TutorialApp = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finalizar tutorial
      navigation.goBack();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    navigation.goBack();
  };

  const goToStep = (stepIndex) => {
    setCurrentStep(stepIndex);
  };

  const currentTutorialStep = tutorialSteps[currentStep];

  return (
    <ScreenLayout navigation={navigation}>
      <View style={styles.container}>
        {/* Header con botón Skip */}
        <View style={styles.header}>
          <TouchableOpacity onPress={skipTutorial} style={styles.skipButton}>
            <Text style={styles.skipText}>Saltar</Text>
          </TouchableOpacity>
        </View>

        {/* Contenido principal */}
        <View style={styles.content}>
          {/* Imagen del paso actual */}
          <View style={styles.imageContainer}>
            <Image 
              source={currentTutorialStep.image} 
              style={styles.tutorialImage}
              resizeMode="contain"
            />
          </View>

          {/* Información del paso */}
          <View style={styles.textContainer}>
            <Text style={styles.stepTitle}>
              {currentTutorialStep.title}
            </Text>
            <Text style={styles.stepDescription}>
              {currentTutorialStep.description}
            </Text>
          </View>

          {/* Indicadores de progreso */}
          <View style={styles.indicatorContainer}>
            {tutorialSteps.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.indicator,
                  { backgroundColor: index === currentStep ? '#007AFF' : '#E0E0E0' }
                ]}
                onPress={() => goToStep(index)}
              />
            ))}
          </View>

          {/* Botones de navegación */}
          <View style={styles.navigationContainer}>
            <TouchableOpacity 
              onPress={prevStep}
              style={[
                styles.navButton, 
                styles.prevButton,
                { opacity: currentStep === 0 ? 0.3 : 1 }
              ]}
              disabled={currentStep === 0}
            >
              <Text style={styles.navButtonText}>Anterior</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={nextStep}
              style={[styles.navButton, styles.nextButton]}
            >
              <Text style={styles.navButtonTextNext}>
                {currentStep === tutorialSteps.length - 1 ? 'Finalizar' : 'Siguiente'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <CustomTabBar navigation={navigation} currentRoute="TutorialApp" />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  skipButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#284F66',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  tutorialImage: {
    width: width * 0.8,
    height: height * 0.4,
    borderRadius: 15,
  },
  textContainer: {
    paddingHorizontal: 10,
    paddingVertical: 20,
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#284F66',
    marginBottom: 15,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#284F66',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingBottom: 30,
  },
  navButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  prevButton: {
    backgroundColor: '#F0F0F0',
  },
  nextButton: {
    backgroundColor: '#284F66',
  },
  navButtonText: {
    fontSize: 16,
    color: '#284F66',
    fontWeight: '600',
  },
  navButtonTextNext: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default TutorialApp;