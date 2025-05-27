import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const CustomDatePicker = ({
  date = new Date(),
  onDateChange,
  minimumDate = new Date(2000, 0, 1),
  maximumDate = new Date(2050, 11, 31),
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(date);
  const [tempYear, setTempYear] = useState(date.getFullYear());
  const [tempMonth, setTempMonth] = useState(date.getMonth());
  const [tempDay, setTempDay] = useState(date.getDate());

  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const years = [];
  const minYear = minimumDate.getFullYear();
  const maxYear = maximumDate.getFullYear();
  for (let i = minYear; i <= maxYear; i++) {
    years.push(i);
  }

  const handleConfirm = () => {
    // Validar que la fecha seleccionada esté dentro del rango permitido
    const newDate = new Date(tempYear, tempMonth, tempDay);

    if (newDate < minimumDate) {
      newDate.setTime(minimumDate.getTime());
    } else if (newDate > maximumDate) {
      newDate.setTime(maximumDate.getTime());
    }

    setSelectedDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
    setModalVisible(false);
  };

  const handleCancel = () => {
    // Restaurar valores temporales a la fecha seleccionada actual
    setTempYear(selectedDate.getFullYear());
    setTempMonth(selectedDate.getMonth());
    setTempDay(selectedDate.getDate());
    setModalVisible(false);
  };

  const generateDays = () => {
    const daysInMonth = getDaysInMonth(tempYear, tempMonth);
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => {
          setTempYear(selectedDate.getFullYear());
          setTempMonth(selectedDate.getMonth());
          setTempDay(selectedDate.getDate());
          setModalVisible(true);
        }}>
        <Text>{formatDate(selectedDate)}</Text>
        <Icon name="calendar-today" size={20} color="#666" />
      </TouchableOpacity>

      <Modal
        transparent={true}
        animationType="slide"
        visible={modalVisible}
        onRequestClose={handleCancel}>
        <View style={styles.modalContainer}>
          <View style={styles.pickerContainer}>
            <Text style={styles.title}>Seleccionar fecha</Text>

            <View style={styles.pickerRow}>
              {/* Selector de Mes */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Mes</Text>
                <ScrollView
                  style={styles.scrollPicker}
                  showsVerticalScrollIndicator={false}>
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.pickerItem,
                        tempMonth === index && styles.selectedPickerItem,
                      ]}
                      onPress={() => {
                        setTempMonth(index);
                        // Ajustar el día si el nuevo mes tiene menos días
                        const daysInNewMonth = getDaysInMonth(tempYear, index);
                        if (tempDay > daysInNewMonth) {
                          setTempDay(daysInNewMonth);
                        }
                      }}>
                      <Text
                        style={[
                          styles.pickerItemText,
                          tempMonth === index && styles.selectedPickerItemText,
                        ]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Selector de Día */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Día</Text>
                <ScrollView
                  style={styles.scrollPicker}
                  showsVerticalScrollIndicator={false}>
                  {generateDays().map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.pickerItem,
                        tempDay === day && styles.selectedPickerItem,
                      ]}
                      onPress={() => setTempDay(day)}>
                      <Text
                        style={[
                          styles.pickerItemText,
                          tempDay === day && styles.selectedPickerItemText,
                        ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Selector de Año */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Año</Text>
                <ScrollView
                  style={styles.scrollPicker}
                  showsVerticalScrollIndicator={false}>
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        tempYear === year && styles.selectedPickerItem,
                      ]}
                      onPress={() => {
                        setTempYear(year);
                        // Ajustar el día si cambia febrero en año bisiesto/no-bisiesto
                        const daysInNewMonth = getDaysInMonth(year, tempMonth);
                        if (tempDay > daysInNewMonth) {
                          setTempDay(daysInNewMonth);
                        }
                      }}>
                      <Text
                        style={[
                          styles.pickerItemText,
                          tempYear === year && styles.selectedPickerItemText,
                        ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={handleConfirm}>
                <Text style={[styles.buttonText, styles.confirmButtonText]}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  datePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#284F66",
  },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#666",
  },
  scrollPicker: {
    height: 150,
    width: "100%",
  },
  pickerItem: {
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  selectedPickerItem: {
    backgroundColor: "#e6f2ff",
  },
  pickerItemText: {
    fontSize: 16,
    color: "#333",
  },
  selectedPickerItemText: {
    fontWeight: "bold",
    color: "#284F66",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  confirmButton: {
    backgroundColor: "#284F66",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  confirmButtonText: {
    color: "white",
  },
});

export default CustomDatePicker;
