import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [minNumber, setMinNumber] = useState('1');
  const [maxNumber, setMaxNumber] = useState('90');
  const [drawnNumber, setDrawnNumber] = useState(null);
  const [drawnNumbers, setDrawnNumbers] = useState([]); // All drawn numbers
  const [history, setHistory] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [autoInterval, setAutoInterval] = useState('5');
  const [displayTime, setDisplayTime] = useState('1'); // Time to show number
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [searchNumber, setSearchNumber] = useState('');
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const spinValue = useState(new Animated.Value(0))[0];

  // Load history from storage
  useEffect(() => {
    loadHistory();
  }, []);

  // Auto spin timer
  useEffect(() => {
    let timer;
    let countdownTimer;
    
    if (isAutoMode && !isSpinning) {
      const interval = parseInt(autoInterval) || 5;
      setCountdown(interval);
      
      countdownTimer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            return interval;
          }
          return prev - 1;
        });
      }, 1000);
      
      timer = setInterval(() => {
        spinNumber();
      }, interval * 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
      if (countdownTimer) clearInterval(countdownTimer);
      setCountdown(0);
    };
  }, [isAutoMode, autoInterval, isSpinning]);

  const loadHistory = async () => {
    try {
      const historyData = await AsyncStorage.getItem('spinHistory');
      if (historyData) {
        setHistory(JSON.parse(historyData));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const saveToHistory = async (number, min, max) => {
    try {
      const newEntry = {
        date: new Date().toLocaleString('vi-VN'),
        number: number,
        range: `${min}-${max}`,
      };
      const newHistory = [newEntry, ...history].slice(0, 50); // Keep last 50
      setHistory(newHistory);
      await AsyncStorage.setItem('spinHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const spinNumber = () => {
    const min = parseInt(minNumber);
    const max = parseInt(maxNumber);

    if (isNaN(min) || isNaN(max)) {
      return;
    }

    if (min >= max) {
      return;
    }

    // Check if all numbers have been drawn
    const totalNumbers = max - min + 1;
    if (drawnNumbers.length >= totalNumbers) {
      return; // All numbers drawn
    }

    // Find available numbers
    const availableNumbers = [];
    for (let i = min; i <= max; i++) {
      if (!drawnNumbers.includes(i)) {
        availableNumbers.push(i);
      }
    }

    if (availableNumbers.length === 0) {
      return;
    }

    setIsSpinning(true);
    
    // Animation
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Simulate spinning effect
    let counter = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * availableNumbers.length);
      setDrawnNumber(availableNumbers[randomIndex]);
      counter++;
      
      if (counter >= 10) {
        clearInterval(interval);
        const finalIndex = Math.floor(Math.random() * availableNumbers.length);
        const finalNumber = availableNumbers[finalIndex];
        setDrawnNumber(finalNumber);
        setDrawnNumbers([...drawnNumbers, finalNumber]);
        
        // Display time based on user input
        const displayDuration = (parseFloat(displayTime) || 1) * 1000;
        setTimeout(() => {
          setIsSpinning(false);
        }, displayDuration);
        
        saveToHistory(finalNumber, min, max);
      }
    }, 100);
  };

  const resetGame = () => {
    setDrawnNumbers([]);
    setDrawnNumber(null);
    setIsAutoMode(false);
    setCountdown(0);
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem('spinHistory');
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>🎰 Quay Số May Mắn</Text>
          <Text style={styles.subtitle}>Nhập khoảng số và quay thôi!</Text>
        </View>

        <View style={styles.settingsSection}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setIsSettingsExpanded(!isSettingsExpanded)}
          >
            <Text style={styles.sectionTitle}>⚙️ Cài đặt</Text>
            <Text style={styles.expandIcon}>{isSettingsExpanded ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          
          {isSettingsExpanded && (
            <>
              {/* Nhập khoảng số */}
              <View style={styles.settingGroup}>
                <Text style={styles.settingGroupTitle}>📝 Nhập khoảng số:</Text>
                <View style={styles.inputRow}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Số nhỏ nhất</Text>
                    <TextInput
                      style={styles.input}
                      value={minNumber}
                      onChangeText={setMinNumber}
                      keyboardType="number-pad"
                      placeholder="1"
                      editable={!isSpinning}
                    />
                  </View>

                  <Text style={styles.separator}>→</Text>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Số lớn nhất</Text>
                    <TextInput
                      style={styles.input}
                      value={maxNumber}
                      onChangeText={setMaxNumber}
                      keyboardType="number-pad"
                      placeholder="90"
                      editable={!isSpinning}
                    />
                  </View>
                </View>
                <Text style={styles.rangeInfo}>
                  Khoảng: {minNumber} - {maxNumber}
                </Text>
              </View>

              {/* Thời gian hiển thị */}
              <View style={styles.settingGroup}>
                <Text style={styles.settingGroupTitle}>⏰ Thời gian hiển thị:</Text>
                <View style={styles.intervalRow}>
                  <Text style={styles.intervalLabel}>Hiển thị số:</Text>
                  <TextInput
                    style={styles.intervalInput}
                    value={displayTime}
                    onChangeText={setDisplayTime}
                    keyboardType="decimal-pad"
                    placeholder="1"
                    editable={!isSpinning}
                  />
                  <Text style={styles.intervalUnit}>giây</Text>
                </View>
              </View>

              {/* Tự động quay - interval setting only */}
              <View style={styles.settingGroup}>
                <Text style={styles.settingGroupTitle}>⏱️ Thời gian tự động quay:</Text>
                <View style={styles.intervalRow}>
                  <Text style={styles.intervalLabel}>Quay sau mỗi:</Text>
                  <TextInput
                    style={styles.intervalInput}
                    value={autoInterval}
                    onChangeText={setAutoInterval}
                    keyboardType="number-pad"
                    placeholder="5"
                    editable={!isAutoMode}
                  />
                  <Text style={styles.intervalUnit}>giây</Text>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.resultContainer}>
          <View style={styles.autoControlInResult}>
            <Text style={styles.autoLabelInResult}>⏱️ Tự động:</Text>
            <TouchableOpacity
              style={[styles.toggleButtonInResult, isAutoMode && styles.toggleButtonActiveInResult]}
              onPress={() => setIsAutoMode(!isAutoMode)}
            >
              <Text style={[styles.toggleButtonTextInResult, isAutoMode && styles.toggleButtonTextActiveInResult]}>
                {isAutoMode ? 'BẬT' : 'TẮT'}
              </Text>
            </TouchableOpacity>
            {isAutoMode && countdown > 0 && (
              <Text style={styles.countdownInResult}>
                {countdown}s
              </Text>
            )}
          </View>

          {drawnNumber !== null ? (
            <>
              <Text style={styles.resultLabel}>Số may mắn của bạn:</Text>
              <Animated.View 
                style={[
                  styles.numberCircle,
                  isSpinning && { transform: [{ rotate: spin }] }
                ]}
              >
                <Text style={styles.resultNumber}>{drawnNumber}</Text>
              </Animated.View>
              <Text style={styles.drawnCount}>
                Đã quay: {drawnNumbers.length}/{parseInt(maxNumber) - parseInt(minNumber) + 1}
              </Text>
            </>
          ) : (
            <View style={styles.emptyResult}>
              <Text style={styles.emptyResultText}>🎲</Text>
              <Text style={styles.emptyResultSubtext}>
                Nhấn nút bên dưới để quay số
              </Text>
            </View>
          )}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.spinButton, (isSpinning || isAutoMode) && styles.spinButtonDisabled]}
            onPress={spinNumber}
            disabled={isSpinning || isAutoMode}
          >
            <Text style={styles.spinButtonText}>
              {isSpinning ? '🎲 Đang quay...' : isAutoMode ? '⏱️ Tự động' : '🎲 Quay Số'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetGame}
          >
            <Text style={styles.resetButtonText}>🔄 Reset</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.drawnSection}>
          <Text style={styles.sectionTitle}>📋 Các số đã quay ({drawnNumbers.length}):</Text>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchNumber}
              onChangeText={setSearchNumber}
              keyboardType="default"
              placeholder="Tìm số (VD: 1, 12, 13)..."
            />
          </View>

          {drawnNumbers.length === 0 ? (
            <Text style={styles.emptyText}>Chưa quay số nào</Text>
          ) : (
            <View style={styles.numbersGrid}>
              {drawnNumbers
                .filter(num => {
                  if (searchNumber === '') return true;
                  // Split by comma and trim spaces
                  const searchNumbers = searchNumber.split(',').map(s => s.trim()).filter(s => s !== '');
                  return searchNumbers.some(searchNum => num.toString() === searchNum);
                })
                .map((num, index) => {
                  const searchNumbers = searchNumber.split(',').map(s => s.trim()).filter(s => s !== '');
                  const isHighlighted = searchNumbers.some(searchNum => num.toString() === searchNum);
                  
                  return (
                    <View 
                      key={index} 
                      style={[
                        styles.gridNumber,
                        isHighlighted && styles.highlightedNumber
                      ]}
                    >
                      <Text style={styles.gridNumberText}>{num}</Text>
                    </View>
                  );
                })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    backgroundColor: '#6200ea',
    padding: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  inputSection: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 0,
  },
  expandIcon: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  separator: {
    fontSize: 24,
    color: '#6200ea',
    marginHorizontal: 15,
    fontWeight: 'bold',
  },
  rangeInfo: {
    marginTop: 15,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  settingsSection: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  settingGroup: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  settingGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 15,
  },
  displaySection: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  autoSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  autoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleButtonActive: {
    backgroundColor: '#4caf50',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  intervalLabel: {
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  intervalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    width: 80,
    marginRight: 10,
  },
  intervalUnit: {
    fontSize: 16,
    color: '#666',
  },
  countdownContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#fff3e0',
    borderRadius: 10,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 14,
    color: '#f57c00',
  },
  countdownNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e65100',
  },
  resultContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 40,
    paddingTop: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 250,
    justifyContent: 'center',
  },
  autoControlInResult: {
    position: 'absolute',
    top: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  autoLabelInResult: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginRight: 8,
  },
  toggleButtonInResult: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
  },
  toggleButtonActiveInResult: {
    backgroundColor: '#4caf50',
  },
  toggleButtonTextInResult: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#666',
  },
  toggleButtonTextActiveInResult: {
    color: '#fff',
  },
  countdownInResult: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f57c00',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultLabel: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    fontWeight: '600',
  },
  numberCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#6200ea',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6200ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  resultNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyResult: {
    alignItems: 'center',
  },
  emptyResultText: {
    fontSize: 80,
    marginBottom: 15,
  },
  emptyResultSubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  drawnCount: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginHorizontal: 15,
    gap: 10,
  },
  spinButton: {
    flex: 2,
    backgroundColor: '#6200ea',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#6200ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  spinButtonDisabled: {
    backgroundColor: '#9e9e9e',
    shadowColor: '#9e9e9e',
  },
  spinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#f44336',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  drawnSection: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  numbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridNumber: {
    width: 50,
    height: 50,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2196f3',
  },
  highlightedNumber: {
    backgroundColor: '#ffd54f',
    borderColor: '#ffa000',
  },
  gridNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  historySection: {
    padding: 15,
    marginTop: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  clearText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  historyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  historyGridItem: {
    width: 70,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  historyGridNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ea',
    marginBottom: 5,
  },
  historyGridDate: {
    fontSize: 10,
    color: '#999',
  },
  historyItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  historyLeft: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#6200ea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  historyNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  historyRight: {
    flex: 1,
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  historyRange: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
});
