import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { OnboardingNavigationProp } from "../../navigation/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

interface OnboardingScreenProps {
  navigation: OnboardingNavigationProp;
}

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: any;
}

const slides: OnboardingSlide[] = [
  {
    id: "1",
    title: "Bienvenido(a) a Jornaleando",
    description: "Únete a una comunidad que impulsa el trabajo agrícola en cultivos de sacha inchi, miel y cacao. Regístrate como productor o trabajador y encuentra oportunidades cerca de ti.",
    image: require("../../../assets/onboarding/slide1.png"),
  },
  {
    id: "2",
    title: "Si eres Productor",
    description: "Encuentra jornaleros disponibles para trabajar en tu terreno, de forma rápida, segura y confiable. Gestiona tus ofertas, fechas y pagos desde un solo lugar.",
    image: require("../../../assets/onboarding/slide2.jpg"),
  },
  {
    id: "3",
    title: "Si eres Trabajador",
    description: "Elige los trabajos que mejor se adapten a ti, con condiciones claras. Haz lo que sabes hacer, trabajando en cultivos de Cacao, Sacha Inchi o Miel.",
    image: require("../../../assets/onboarding/slide3.png"),
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleGetStarted = async () => {
    await AsyncStorage.setItem("@has_seen_onboarding", "true");
    navigation.navigate("Login");
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: width * (currentIndex + 1),
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(slideIndex);
  };

  const renderSlide = (slide: OnboardingSlide) => (
    <View key={slide.id} style={styles.slide}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Background Image */}
      <Image source={slide.image} style={styles.backgroundImage} resizeMode="cover" />
      
      {/* Dark Overlay */}
      <View style={styles.overlay} />
      
      {/* Content */}
      <View style={styles.contentContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>
        </View>
      </View>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: currentIndex === index ? "#fff" : "rgba(255, 255, 255, 0.3)",
              width: currentIndex === index ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}>
        {slides.map(renderSlide)}
      </ScrollView>

      {/* Footer with dots and buttons */}
      <View style={styles.footer}>
        {renderDots()}

        <View style={styles.buttonContainer}>
          {currentIndex < slides.length - 1 ? (
            <>
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Omitir</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                <Text style={styles.nextText}>Siguiente</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={handleGetStarted}
              style={styles.getStartedButton}>
              <Text style={styles.getStartedText}>Comenzar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  slide: {
    width,
    height,
    position: "relative",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 180, // Space for footer
  },
  textContainer: {
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 24,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
    paddingBottom: 50,
    paddingTop: 20,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    transition: "all 0.3s ease",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skipButton: {
    padding: 15,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.7)",
  },
  nextButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  getStartedButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
    flex: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export default OnboardingScreen;