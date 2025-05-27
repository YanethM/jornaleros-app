// src/components/PhoneInput.tsx
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';

interface CountryCode {
  id: string;
  code: string;
  name: string;
  phoneLength: number;
  flag?: string;
}

interface PhoneInputProps {
  label: string;
  countryCode: string;
  phoneNumber: string;
  onCountryChange: (countryId: string) => void;
  onPhoneChange: (phone: string) => void;
  countries: CountryCode[];
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  countryCode,
  phoneNumber,
  onCountryChange,
  onPhoneChange,
  countries,
}) => {
  const [modalVisible, setModalVisible] = React.useState(false);
  const selectedCountry = countries.find(c => c.id === countryCode);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.phoneContainer}>
        <TouchableOpacity
          style={styles.countrySelector}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.flag}>{selectedCountry?.flag || '🌎'}</Text>
          <Text style={styles.countryCode}>{selectedCountry?.code}</Text>
          <Text style={styles.arrow}>▼</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.phoneInput}
          value={phoneNumber}
          onChangeText={onPhoneChange}
          placeholder={`Ej: ${selectedCountry?.phoneLength === 10 ? '3001234567' : '41412345678'}`}
          keyboardType="phone-pad"
          maxLength={selectedCountry?.phoneLength}
          placeholderTextColor="#999"
        />
      </View>

      <Text style={styles.helperText}>
        {selectedCountry && `Debe tener ${selectedCountry.phoneLength} dígitos`}
      </Text>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona un país</Text>
            <FlatList
              data={countries}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryOption}
                  onPress={() => {
                    onCountryChange(item.id);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.flag}>{item.flag || '🌎'}</Text>
                  <Text style={styles.countryName}>{item.name}</Text>
                  <Text style={styles.countryCode}>{item.code}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minWidth: 120,
  },
  flag: {
    fontSize: 20,
    marginRight: 8,
  },
  countryCode: {
    fontSize: 16,
    color: '#333',
    marginRight: 4,
  },
  arrow: {
    fontSize: 10,
    color: '#666',
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
});

export default PhoneInput;