// import React from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   TouchableOpacity,
//   Platform,
// } from "react-native";
// import Icon from "react-native-vector-icons/MaterialIcons";

// const PRIMARY_COLOR = "#284F66";
// const SECONDARY_COLOR = "#4A7C94";

// const SimpleJobOfferList = ({ jobOffers, onPressItem }) => {
//   const formatDate = (dateString) => {
//     const options = { day: "2-digit", month: "short", year: "numeric" };
//     return new Date(dateString).toLocaleDateString("es-ES", options);
//   };

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat("es-CO", {
//       style: "currency",
//       currency: "COP",
//       minimumFractionDigits: 0,
//     }).format(amount);
//   };

//   const getStatusConfig = (status) => {
//     const configs = {
//       Activo: {
//         color: "#4CAF50",
//         backgroundColor: "#E8F5E9",
//         icon: "check-circle",
//         label: "Activo",
//       },
//       Inactivo: {
//         color: "#757575",
//         backgroundColor: "#F5F5F5",
//         icon: "pause",
//         label: "Inactivo",
//       },
//       En_curso: {
//         color: "#FF9800",
//         backgroundColor: "#FFF3E0",
//         icon: "work",
//         label: "En curso",
//       },
//       Finalizado: {
//         color: "#E57373",
//         backgroundColor: "#FFEBEE",
//         icon: "done-all",
//         label: "Finalizado",
//       },
//     };
//     return configs[status] || configs.Activo;
//   };

//   const hasCompleteLocation = (item) => {
//     return (
//       item.displayLocation?.village &&
//       item.displayLocation.village !== "No especificado" &&
//       item.farm?.name
//     );
//   };

//   const renderJobOffer = ({ item, index }) => {
//     const statusConfig = getStatusConfig(item.status);
//     const totalCompensation =
//       item.salary +
//       (item.includesFood ? item.foodCost : 0) +
//       (item.includesLodging ? item.lodgingCost : 0);

//     return (
//       <TouchableOpacity
//         style={[styles.jobCard, { marginTop: index === 0 ? 16 : 0 }]}
//         onPress={() => onPressItem && onPressItem(item)}
//         activeOpacity={0.8}>
//         {/* Header con título y estado */}
//         <View style={styles.cardHeader}>
//           <View style={styles.titleContainer}>
//             <Text style={styles.title} numberOfLines={2}>
//               {item.title}
//             </Text>
//             <View style={styles.locationContainer}>
//               <View style={styles.locationBadge}>
//                 <Icon name="location-on" size={14} color="#666" />
//                 <Text style={styles.locationText} numberOfLines={1}>
//                   {item.farmInfo?.location?.country || "Sin"}
//                 </Text>
//               </View>
//               <View style={styles.locationBadge}>
//                 <Icon name="map" size={14} color="#666" />
//                 <Text style={styles.locationText} numberOfLines={1}>
//                   {item.farmInfo?.location?.department}
//                 </Text>
//               </View>
//             </View>
//             {/* Mostrar país y vereda si están disponibles */}
//             <View style={styles.additionalLocationContainer}>
//               <Text style={styles.additionalLocationText}>
//                 <Icon name="public" size={12} color="#999" />{" "}
//                 {item.displayLocation?.country || "Colombia"}
//                 {item.displayLocation?.village &&
//                   item.displayLocation.village !== "No especificado" && (
//                     <>
//                       {" • "}
//                       <Icon name="home" size={12} color="#999" /> Vereda:{" "}
//                       {item.displayLocation.village}
//                     </>
//                   )}
//               </Text>
//               {!hasCompleteLocation(item) && (
//                 <View style={styles.incompleteLocationNotice}>
//                   <Icon name="info-outline" size={12} color="#FF9800" />
//                   <Text style={styles.incompleteLocationText}>
//                     Información de ubicación incompleta
//                   </Text>
//                 </View>
//               )}
//             </View>
//           </View>
//           <View
//             style={[
//               styles.statusBadge,
//               { backgroundColor: statusConfig.backgroundColor },
//             ]}>
//             <Icon
//               name={statusConfig.icon}
//               size={16}
//               color={statusConfig.color}
//             />
//             <Text style={[styles.statusText, { color: statusConfig.color }]}>
//               {statusConfig.label}
//             </Text>
//           </View>
//         </View>

//         {/* Información del cultivo */}
//         <View style={styles.cropSection}>
//           <View style={styles.cropItem}>
//             <View
//               style={[styles.iconContainer, { backgroundColor: "#E8F5E9" }]}>
//               <Icon name="eco" size={18} color="#4CAF50" />
//             </View>
//             <View style={styles.cropInfo}>
//               <Text style={styles.cropLabel}>Cultivo</Text>
//               <Text style={styles.cropValue}>
//                 {item.cropType?.name || "No especificado"}
//               </Text>
//             </View>
//           </View>
//           <View style={styles.cropItem}>
//             <View
//               style={[styles.iconContainer, { backgroundColor: "#FFF3E0" }]}>
//               <Icon name="layers" size={18} color="#FF9800" />
//             </View>
//             <View style={styles.cropInfo}>
//               <Text style={styles.cropLabel}>Fase</Text>
//               <Text style={styles.cropValue}>
//                 {item.phase?.name || "No especificada"}
//               </Text>
//             </View>
//           </View>
//         </View>

//         {/* Información de la finca si está disponible */}
//         {(item.farm?.name || item.farmName) && (
//           <View style={styles.farmInfoBanner}>
//             <Icon name="agriculture" size={16} color={SECONDARY_COLOR} />
//             <Text style={styles.farmInfoText}>
//               Finca: {item.farm?.name || item.farmName || "Sin nombre"}
//             </Text>
//           </View>
//         )}

//         {/* Fechas y duración */}
//         <View style={styles.dateSection}>
//           <Icon name="date-range" size={20} color={PRIMARY_COLOR} />
//           <View style={styles.dateInfo}>
//             <Text style={styles.dateText}>
//               {formatDate(item.startDate)} - {formatDate(item.endDate)}
//             </Text>
//             <Text style={styles.durationText}>
//               {item.duration} días de trabajo
//             </Text>
//           </View>
//         </View>

//         {/* Información de pago */}
//         <View style={styles.paymentSection}>
//           <View style={styles.salaryContainer}>
//             <Text style={styles.salaryLabel}>
//               {item.paymentType === "Por_dia"
//                 ? "Salario diario"
//                 : "Pago por labor"}
//             </Text>
//             <Text style={styles.salaryAmount}>
//               {formatCurrency(item.salary)}
//             </Text>
//             <Text style={styles.paymentMode}>{item.paymentMode}</Text>
//           </View>
//           {(item.includesFood || item.includesLodging) && (
//             <View style={styles.totalPackageContainer}>
//               <Text style={styles.totalPackageLabel}>Paquete total</Text>
//               <Text style={styles.totalPackageAmount}>
//                 {formatCurrency(totalCompensation)}
//               </Text>
//               <Text style={styles.totalPackageSubtext}>incluye beneficios</Text>
//             </View>
//           )}
//         </View>

//         {/* Beneficios */}
//         <View style={styles.benefitsSection}>
//           <View
//             style={[
//               styles.benefitBadge,
//               item.includesLodging
//                 ? styles.benefitActive
//                 : styles.benefitInactive,
//             ]}>
//             <Icon
//               name="hotel"
//               size={16}
//               color={item.includesLodging ? "#1976D2" : "#BDBDBD"}
//             />
//             <Text
//               style={[
//                 styles.benefitText,
//                 { color: item.includesLodging ? "#1976D2" : "#BDBDBD" },
//               ]}>
//               Alojamiento
//               {item.includesLodging && ` (${formatCurrency(item.lodgingCost)})`}
//             </Text>
//           </View>
//           <View
//             style={[
//               styles.benefitBadge,
//               item.includesFood ? styles.benefitActive : styles.benefitInactive,
//             ]}>
//             <Icon
//               name="restaurant"
//               size={16}
//               color={item.includesFood ? "#43A047" : "#BDBDBD"}
//             />
//             <Text
//               style={[
//                 styles.benefitText,
//                 { color: item.includesFood ? "#43A047" : "#BDBDBD" },
//               ]}>
//               Alimentación
//               {item.includesFood && ` (${formatCurrency(item.foodCost)})`}
//             </Text>
//           </View>
//         </View>

//         {/* Footer con aplicaciones y botón */}
//         <View style={styles.cardFooter}>
//           <View style={styles.applicationsContainer}>
//             <Icon name="people" size={20} color={SECONDARY_COLOR} />
//             <Text style={styles.applicationsText}>
//               {item.applicationsCount || 0} postulaciones
//             </Text>
//           </View>
//           <View style={styles.viewButton}>
//             <Text style={styles.viewButtonText}>Ver detalles</Text>
//             <Icon name="arrow-forward" size={16} color="#fff" />
//           </View>
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <FlatList
//       data={jobOffers}
//       renderItem={renderJobOffer}
//       keyExtractor={(item) => item.id}
//       contentContainerStyle={styles.list}
//       showsVerticalScrollIndicator={false}
//       ItemSeparatorComponent={() => <View style={styles.separator} />}
//     />
//   );
// };

// const styles = StyleSheet.create({
//   list: {
//     paddingHorizontal: 16,
//     paddingBottom: 100,
//   },
//   separator: {
//     height: 12,
//   },
//   jobCard: {
//     backgroundColor: "#fff",
//     borderRadius: 16,
//     ...Platform.select({
//       ios: {
//         shadowColor: PRIMARY_COLOR,
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.1,
//         shadowRadius: 12,
//       },
//       android: {
//         elevation: 6,
//       },
//     }),
//     overflow: "hidden",
//   },
//   cardHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "flex-start",
//     padding: 16,
//     backgroundColor: "#F8F9FA",
//     borderBottomWidth: 1,
//     borderBottomColor: "#E8EAF0",
//   },
//   titleContainer: {
//     flex: 1,
//     marginRight: 12,
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#1A1A1A",
//     marginBottom: 6,
//     lineHeight: 24,
//   },
//   locationContainer: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 8,
//     marginBottom: 4,
//   },
//   locationBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   locationText: {
//     fontSize: 12,
//     color: "#666",
//     marginLeft: 4,
//     fontWeight: "500",
//   },
//   additionalLocationContainer: {
//     marginTop: 4,
//   },
//   additionalLocationText: {
//     fontSize: 11,
//     color: "#999",
//     fontStyle: "italic",
//   },
//   incompleteLocationNotice: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 4,
//     backgroundColor: "#FFF3E0",
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: 10,
//     alignSelf: "flex-start",
//   },
//   incompleteLocationText: {
//     fontSize: 10,
//     color: "#F57C00",
//     marginLeft: 4,
//     fontWeight: "500",
//   },
//   statusBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//   },
//   statusText: {
//     fontSize: 12,
//     fontWeight: "600",
//     marginLeft: 6,
//   },
//   cropSection: {
//     flexDirection: "row",
//     padding: 16,
//     paddingBottom: 12,
//   },
//   cropItem: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   iconContainer: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   cropInfo: {
//     marginLeft: 10,
//     flex: 1,
//   },
//   cropLabel: {
//     fontSize: 11,
//     color: "#888",
//     marginBottom: 2,
//     textTransform: "uppercase",
//     letterSpacing: 0.5,
//   },
//   cropValue: {
//     fontSize: 14,
//     color: "#333",
//     fontWeight: "600",
//   },
//   farmInfoBanner: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#F0F7FF",
//     marginHorizontal: 16,
//     marginTop: -8,
//     marginBottom: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "#D0E4FF",
//   },
//   farmInfoText: {
//     fontSize: 12,
//     color: SECONDARY_COLOR,
//     fontWeight: "600",
//     marginLeft: 6,
//   },
//   dateSection: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginHorizontal: 16,
//     padding: 12,
//     backgroundColor: "#F5F8FA",
//     borderRadius: 10,
//   },
//   dateInfo: {
//     marginLeft: 12,
//     flex: 1,
//   },
//   dateText: {
//     fontSize: 14,
//     color: "#333",
//     fontWeight: "600",
//   },
//   durationText: {
//     fontSize: 12,
//     color: "#666",
//     marginTop: 2,
//   },
//   paymentSection: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: 16,
//     paddingTop: 12,
//   },
//   salaryContainer: {
//     flex: 1,
//   },
//   salaryLabel: {
//     fontSize: 12,
//     color: "#666",
//     marginBottom: 4,
//   },
//   salaryAmount: {
//     fontSize: 24,
//     fontWeight: "700",
//     color: PRIMARY_COLOR,
//     marginBottom: 2,
//   },
//   paymentMode: {
//     fontSize: 12,
//     color: "#888",
//     fontStyle: "italic",
//   },
//   totalPackageContainer: {
//     backgroundColor: "#E3F2FD",
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 10,
//     alignItems: "center",
//     marginLeft: 12,
//   },
//   totalPackageLabel: {
//     fontSize: 10,
//     color: "#1565C0",
//     textTransform: "uppercase",
//     letterSpacing: 0.5,
//   },
//   totalPackageAmount: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#1976D2",
//     marginVertical: 2,
//   },
//   totalPackageSubtext: {
//     fontSize: 10,
//     color: "#1565C0",
//   },
//   benefitsSection: {
//     flexDirection: "row",
//     paddingHorizontal: 16,
//     paddingBottom: 12,
//     gap: 8,
//   },
//   benefitBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//     borderWidth: 1,
//   },
//   benefitActive: {
//     backgroundColor: "#F5F5F5",
//     borderColor: "#E0E0E0",
//   },
//   benefitInactive: {
//     backgroundColor: "#FAFAFA",
//     borderColor: "#F0F0F0",
//     opacity: 0.7,
//   },
//   benefitText: {
//     fontSize: 12,
//     fontWeight: "500",
//     marginLeft: 6,
//   },
//   cardFooter: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: 16,
//     backgroundColor: "#F8F9FA",
//     borderTopWidth: 1,
//     borderTopColor: "#E8EAF0",
//   },
//   applicationsContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   applicationsText: {
//     fontSize: 14,
//     color: SECONDARY_COLOR,
//     fontWeight: "600",
//     marginLeft: 8,
//   },
//   viewButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: PRIMARY_COLOR,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//   },
//   viewButtonText: {
//     fontSize: 14,
//     color: "#fff",
//     fontWeight: "600",
//     marginRight: 6,
//   },
// });

// export default SimpleJobOfferList;
