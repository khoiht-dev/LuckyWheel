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
  Platform,
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

  // Loto tracking states
  const [lotoCards, setLotoCards] = useState([]);
  const [currentCardInput, setCurrentCardInput] = useState('');
  const [editingCardIndex, setEditingCardIndex] = useState(null);
  const [trackedNumbers, setTrackedNumbers] = useState([]);
  const [winningCards, setWinningCards] = useState([]);
  const [trackingInput, setTrackingInput] = useState('');

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
        setDrawnNumbers(prev => [...prev, finalNumber]);
        
        // Auto track in loto cards
        trackNumberInCards(finalNumber);
        
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

  // Loto Tracking Functions
  const addLotoCard = () => {
    if (!currentCardInput.trim()) return;
    
    // Parse input: expected format "12 - 34 40 - 75 89 - -, 8 16 - 42 55 - 77 - -, 5 - 24 33 - 67 - 83 -"
    const rawRows = currentCardInput.split(',').map(r => r.trim());
    
    // Filter out empty rows (handles trailing commas)
    const rows = rawRows.filter(r => r.length > 0);

    if (rows.length !== 3) {
      alert(`Vui lòng nhập đủ 3 hàng (bạn nhập ${rows.length} hàng). Cách nhau bằng dấu phẩy.`);
      return;
    }

    const card = {
      id: Date.now(),
      rows: rows.map(row => {
        const cells = row.split(/\s+/).filter(n => n);
        if (cells.length !== 9) {
          alert('Mỗi hàng phải có đủ 9 ô (dùng - cho ô trống)');
          throw new Error('Invalid row length');
        }
        return cells.map(cell => cell === '-' ? undefined : parseInt(cell));
      }),
      markedCells: Array(3).fill(null).map(() => Array(9).fill(false))
    };

    // Validate
    if (card.rows.some(row => row.length !== 9)) {
      alert('Mỗi hàng phải có đủ 9 ô');
      return;
    }

    if (editingCardIndex !== null) {
      const newCards = [...lotoCards];
      newCards[editingCardIndex] = card;
      setLotoCards(newCards);
      setEditingCardIndex(null);
    } else {
      setLotoCards([...lotoCards, card]);
    }
    
    setCurrentCardInput('');
  };

  const deleteCard = (index) => {
    const newCards = lotoCards.filter((_, i) => i !== index);
    setLotoCards(newCards);
    setWinningCards(winningCards.filter(i => i !== index));
  };

  const editCard = (index) => {
    const card = lotoCards[index];
    const cardString = card.rows.map(row => 
      row.map(cell => cell === undefined ? '-' : cell).join(' ')
    ).join(', ');
    setCurrentCardInput(cardString);
    setEditingCardIndex(index);
  };

  const trackNumberInCards = (number) => {
    if (trackedNumbers.includes(number)) return;
    
    setTrackedNumbers(prev => [...prev, number]);
    
    const newCards = lotoCards.map((card, cardIndex) => {
      const newMarkedCells = card.markedCells.map((row, rowIndex) => 
        row.map((marked, colIndex) => {
          if (card.rows[rowIndex][colIndex] === number) {
            return true;
          }
          return marked;
        })
      );

      // Check if any row is complete
      const hasWinningRow = newMarkedCells.some(row => {
        const filledCells = row.filter((_, idx) => card.rows[newMarkedCells.indexOf(row)][idx] !== undefined);
        const markedFilledCells = filledCells.filter((marked, idx) => {
          const rowIdx = newMarkedCells.indexOf(row);
          return marked && card.rows[rowIdx][idx] !== undefined;
        });
        return markedFilledCells.length === filledCells.length && filledCells.length > 0;
      });

      if (hasWinningRow && !winningCards.includes(cardIndex)) {
        setWinningCards(prev => [...prev, cardIndex]);
        setIsAutoMode(false); // Stop auto mode when winning
      }

      return { ...card, markedCells: newMarkedCells };
    });

    setLotoCards(newCards);
  };

  const manualTrackNumber = () => {
    const numbers = trackingInput.split(',').map(n => n.trim()).filter(n => n);
    numbers.forEach(numStr => {
      const num = parseInt(numStr);
      if (!isNaN(num)) {
        trackNumberInCards(num);
      }
    });
    setTrackingInput('');
  };

  const resetTracking = () => {
    setLotoCards(lotoCards.map(card => ({
      ...card,
      markedCells: Array(3).fill(null).map(() => Array(9).fill(false))
    })));
    setTrackedNumbers([]);
    setWinningCards([]);
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={true}
      >
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

              {/* Loto Card Input */}
              <View style={styles.settingGroup}>
                <Text style={styles.settingGroupTitle}>🎯 Nhập vé loto:</Text>
                <Text style={styles.cardInputHintSmall}>
                  Nhập 3 hàng, mỗi hàng 9 ô (dùng - cho ô trống){'\n'}
                  VD: 12 - 34 40 - 75 89 - -, 8 16 - 42 55 - 77 - -, 5 - 24 33 - 67 - 83 -
                </Text>
                <TextInput
                  style={styles.cardInputTextSmall}
                  value={currentCardInput}
                  onChangeText={setCurrentCardInput}
                  placeholder="12 - 34 40 - 75 89 - -, ..."
                  multiline
                />
                <View style={styles.cardInputButtons}>
                  <TouchableOpacity style={styles.addCardButtonSmall} onPress={addLotoCard}>
                    <Text style={styles.addCardButtonText}>
                      {editingCardIndex !== null ? '💾 Lưu' : '➕ Thêm vé'}
                    </Text>
                  </TouchableOpacity>
                  {editingCardIndex !== null && (
                    <TouchableOpacity 
                      style={styles.cancelEditButton} 
                      onPress={() => {
                        setEditingCardIndex(null);
                        setCurrentCardInput('');
                      }}
                    >
                      <Text style={styles.cancelEditButtonText}>❌ Hủy</Text>
                    </TouchableOpacity>
                  )}
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

          <View style={styles.resultContentWrapper}>
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
        </View>

        {/* Loto Tracking Grid */}
        {lotoCards.length > 0 && (
          <View style={styles.lotoTrackingSection}>
            <View style={styles.lotoTrackingHeader}>
              <Text style={styles.lotoTrackingTitle}>🎯 Vé Loto Tracking</Text>
              <TouchableOpacity onPress={resetTracking}>
                <Text style={styles.resetTrackingTextSmall}>🔄 Reset</Text>
              </TouchableOpacity>
            </View>
            
            {trackedNumbers.length > 0 && (
              <View style={styles.trackedSectionSmall}>
                <Text style={styles.trackedTitleSmall}>Số đã tracking ({trackedNumbers.length}):</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  <View style={styles.trackedGridSmall}>
                    {trackedNumbers.map((num, idx) => (
                      <View key={idx} style={styles.trackedNumberSmall}>
                        <Text style={styles.trackedNumberTextSmall}>{num}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true} 
              style={styles.cardsScrollContainer}
              nestedScrollEnabled={true}
            >
              <View style={styles.cardsRow}>
                {lotoCards.map((card, cardIndex) => (
                  <View 
                    key={card.id} 
                    style={[
                      styles.lotoCardSmall,
                      winningCards.includes(cardIndex) && styles.winningCardSmall
                    ]}
                  >
                    <View style={styles.cardHeaderSmall}>
                      <Text style={styles.cardTitleSmall}>
                        {winningCards.includes(cardIndex) ? '🏆 VÉ #' : '🎫 VÉ #'}{cardIndex + 1}
                        {winningCards.includes(cardIndex) && ' - THẮNG! 🎉'}
                      </Text>
                      <View style={styles.cardActions}>
                        <TouchableOpacity onPress={() => editCard(cardIndex)}>
                          <Text style={styles.cardActionTextSmall}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteCard(cardIndex)}>
                          <Text style={styles.cardActionTextSmall}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <View style={styles.cardGridSmall}>
                      {card.rows.map((row, rowIndex) => (
                        <View key={rowIndex} style={styles.cardRowSmall}>
                          {row.map((number, colIndex) => {
                            const isMarked = card.markedCells[rowIndex][colIndex];
                            
                            return (
                              <View 
                                key={colIndex} 
                                style={[
                                  styles.cardCellSmall,
                                  number === undefined && styles.emptyCellSmall,
                                  isMarked && styles.markedCellSmall
                                ]}
                              >
                                {number !== undefined && (
                                  <Text style={[
                                    styles.cardCellTextSmall,
                                    isMarked && styles.markedCellTextSmall
                                  ]}>
                                    {number}
                                  </Text>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

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
    ...Platform.select({
      web: {
        height: '100vh',
        overflow: 'hidden',
      },
    }),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 300,
  },
  autoControlInResult: {
    alignSelf: 'flex-end',
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
    marginBottom: 10,
    zIndex: 1,
  },
  resultContentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
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
  // Tracking Tab Styles
  trackingContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  trackingHeader: {
    backgroundColor: '#6200ea',
    padding: 20,
    alignItems: 'center',
  },
  trackingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  trackingSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  cardInputSection: {
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
  cardInputLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardInputHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  cardInputText: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  cardInputButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  addCardButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  addCardButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelEditButton: {
    flex: 1,
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelEditButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  manualTrackSection: {
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
  manualTrackLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  manualTrackRow: {
    flexDirection: 'row',
    gap: 10,
  },
  manualTrackInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  trackButton: {
    backgroundColor: '#6200ea',
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  trackedSection: {
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
  trackedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trackedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  resetTrackingText: {
    fontSize: 14,
    color: '#f44336',
    fontWeight: '600',
  },
  trackedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trackedNumber: {
    width: 50,
    height: 50,
    backgroundColor: '#4caf50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackedNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardsScrollView: {
    flex: 1,
    paddingHorizontal: 15,
  },
  emptyCards: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyCardsText: {
    fontSize: 80,
    marginBottom: 15,
  },
  emptyCardsSubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
  lotoCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#e0e0e0',
  },
  winningCard: {
    borderColor: '#ffd700',
    backgroundColor: '#fffbf0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 15,
  },
  cardActionText: {
    fontSize: 20,
  },
  cardGrid: {
    gap: 5,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 5,
  },
  cardCell: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffa000',
  },
  emptyCell: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  markedCell: {
    backgroundColor: '#4caf50',
    borderColor: '#2e7d32',
  },
  cardCellText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e65100',
  },
  markedCellText: {
    color: '#fff',
  },
  // Inline Loto Tracking Styles
  cardInputHintSmall: {
    fontSize: 11,
    color: '#666',
    marginBottom: 10,
    lineHeight: 16,
  },
  cardInputTextSmall: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  addCardButtonSmall: {
    flex: 1,
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  lotoTrackingSection: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  lotoTrackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
  },
  lotoTrackingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  resetTrackingTextSmall: {
    fontSize: 14,
    color: '#f44336',
    fontWeight: '600',
  },
  trackedSectionSmall: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  trackedTitleSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  trackedGridSmall: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 15,
  },
  cardsScrollContainer: {
    maxHeight: 200,
  },
  trackedNumberSmall: {
    width: 40,
    height: 40,
    backgroundColor: '#4caf50',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackedNumberTextSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  lotoCardSmall: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    width: 350,
    marginRight: 10,
  },
  winningCardSmall: {
    borderColor: '#ffd700',
    backgroundColor: '#fffbf0',
  },
  cardHeaderSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitleSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  cardActionTextSmall: {
    fontSize: 18,
  },
  cardGridSmall: {
    gap: 4,
  },
  cardRowSmall: {
    flexDirection: 'row',
    gap: 4,
  },
  cardCellSmall: {
    width: 32,
    height: 32,
    backgroundColor: '#fff3e0',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffa000',
  },
  emptyCellSmall: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  markedCellSmall: {
    backgroundColor: '#4caf50',
    borderColor: '#2e7d32',
  },
  cardCellTextSmall: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#e65100',
  },
  markedCellTextSmall: {
    color: '#fff',
  },
});
