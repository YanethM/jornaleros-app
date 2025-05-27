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
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
}

const slides: OnboardingSlide[] = [
  {
    id: "1",
    title: "Bienvenido a Paso Colombia",
    description: "Gestiona tus trámites migratorios de forma rápida y segura",
    image: require("../../../assets/onboarding/slide1.webp"),
    backgroundColor: "#F0F8FF",
    primaryColor: "#284F66",
    secondaryColor: "#284F66",
  },
  {
    id: "2",
    title: "Todo en un solo lugar",
    description:
      "Accede a tus documentos, solicitudes y notificaciones desde cualquier lugar",
    image: require("../../../assets/onboarding/slide2.webp"),
    backgroundColor: "#F0F8FF",
    primaryColor: "#284F66",
    secondaryColor: "#284F66",
  },
  {
    id: "3",
    title: "Proceso simplificado",
    description:
      "Completa tus trámites en minutos, no en horas. Sin filas, sin esperas",
    image: require("../../../assets/onboarding/slide3.avif"),
    backgroundColor: "#F0F8FF",
    primaryColor: "#284F66",
    secondaryColor: "#284F66",
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
    <View
      key={slide.id}
      style={[styles.slide, { backgroundColor: slide.backgroundColor }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.imageContainer}>
        <Image source={slide.image} style={styles.image} resizeMode="cover" />
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: slide.primaryColor }]}>
          {slide.title}
        </Text>
        <Text style={[styles.description, { color: slide.secondaryColor }]}>
          {slide.description}
        </Text>
      </View>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((slide, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor:
                currentIndex === index
                  ? slide.primaryColor
                  : `${slide.primaryColor}30`,
            },
            currentIndex === index && styles.activeDot,
          ]}
        />
      ))}
    </View>
  );

  const currentSlide = slides[currentIndex];

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

      <View style={styles.footer}>
        {renderDots()}

        <View style={styles.buttonContainer}>
          {currentIndex < slides.length - 1 ? (
            <>
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text
                  style={[
                    styles.skipText,
                    { color: currentSlide.secondaryColor },
                  ]}>
                  Omitir
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNext}
                style={[
                  styles.nextButton,
                  { backgroundColor: currentSlide.primaryColor },
                ]}>
                <Text style={styles.nextText}>Siguiente</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={handleGetStarted}
              style={[
                styles.getStartedButton,
                { backgroundColor: currentSlide.primaryColor },
              ]}>
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
    backgroundColor: "#fff",
  },
  slide: {
    width,
    height,
  },
  imageContainer: {
    width,
    height: height * 0.55,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  description: {
    fontSize: 18,
    textAlign: "center",
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  footer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
  },
  activeDot: {
    width: 24,
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
  },
  nextButton: {
    paddingHorizontal: 35,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  nextText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  getStartedButton: {
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
    flex: 1,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  getStartedText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export default OnboardingScreen;