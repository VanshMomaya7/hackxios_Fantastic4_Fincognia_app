/**
 * Stock Simulator Screen
 * Virtual portfolio simulator for learning stock trading
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Stock {
  id: string;
  name: string;
  symbol: string;
  type: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  pe: number;
  source: string;
}

interface Holding {
  id: string;
  name: string;
  symbol: string;
  type: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  totalInvested: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  sector: string;
}

interface Transaction {
  id: number;
  type: string;
  stock: string;
  symbol: string;
  quantity: number;
  price: number;
  total: number;
  timestamp: Date;
}

export default function StockSimulatorScreen() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'markets' | 'watchlist'>('dashboard');
  const [portfolio, setPortfolio] = useState<Holding[]>([]);
  const [watchlist, setWatchlist] = useState<Stock[]>([]);
  const [virtualCash, setVirtualCash] = useState(100000);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [frozenStockPrice, setFrozenStockPrice] = useState<number | null>(null);
  const [buyQuantity, setBuyQuantity] = useState('1');
  const [totalInvested, setTotalInvested] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [marketData, setMarketData] = useState<Stock[]>([
    {
      id: "RELIANCE",
      name: "Reliance Industries",
      symbol: "RELIANCE",
      type: "stock",
      sector: "Oil & Gas",
      price: 2456.75,
      change: 45.3,
      changePercent: 1.88,
      marketCap: "16.6L Cr",
      pe: 24.5,
      source: "simulated",
    },
    {
      id: "TCS",
      name: "Tata Consultancy Services",
      symbol: "TCS",
      type: "stock",
      sector: "IT Services",
      price: 3542.85,
      change: -28.15,
      changePercent: -0.79,
      marketCap: "12.9L Cr",
      pe: 28.3,
      source: "simulated",
    },
    {
      id: "HDFCBANK",
      name: "HDFC Bank",
      symbol: "HDFCBANK",
      type: "stock",
      sector: "Banking",
      price: 1634.5,
      change: 23.75,
      changePercent: 1.47,
      marketCap: "12.4L Cr",
      pe: 18.7,
      source: "simulated",
    },
    {
      id: "INFY",
      name: "Infosys",
      symbol: "INFY",
      type: "stock",
      sector: "IT Services",
      price: 1456.3,
      change: -12.45,
      changePercent: -0.85,
      marketCap: "6.1L Cr",
      pe: 26.8,
      source: "simulated",
    },
    {
      id: "ICICIBANK",
      name: "ICICI Bank",
      symbol: "ICICIBANK",
      type: "stock",
      sector: "Banking",
      price: 1087.65,
      change: 15.3,
      changePercent: 1.43,
      marketCap: "7.6L Cr",
      pe: 16.2,
      source: "simulated",
    },
    {
      id: "HINDUNILVR",
      name: "Hindustan Unilever",
      symbol: "HINDUNILVR",
      type: "stock",
      sector: "FMCG",
      price: 2678.9,
      change: 34.2,
      changePercent: 1.29,
      marketCap: "6.3L Cr",
      pe: 58.4,
      source: "simulated",
    },
    {
      id: "SBIN",
      name: "State Bank of India",
      symbol: "SBIN",
      type: "stock",
      sector: "Banking",
      price: 542.3,
      change: -8.7,
      changePercent: -1.58,
      marketCap: "4.8L Cr",
      pe: 10.2,
      source: "simulated",
    },
    {
      id: "BHARTIARTL",
      name: "Bharti Airtel",
      symbol: "BHARTIARTL",
      type: "stock",
      sector: "Telecom",
      price: 876.45,
      change: 12.8,
      changePercent: 1.48,
      marketCap: "5.1L Cr",
      pe: 22.1,
      source: "simulated",
    },
  ])

  const simulatePriceUpdates = (): void => {
    setMarketData((prevData) =>
      prevData.map((item) => {
        const randomChange = (Math.random() - 0.5) * 0.02;
        const newPrice = Math.max(0.01, item.price * (1 + randomChange));
        const priceChange = newPrice - item.price;
        const percentChange = (priceChange / item.price) * 100;

        return {
          ...item,
          price: Number.parseFloat(newPrice.toFixed(2)),
          change: Number.parseFloat(priceChange.toFixed(2)),
          changePercent: Number.parseFloat(percentChange.toFixed(2)),
        };
      }),
    );
    setLastUpdated(new Date());
  };

  const updatePortfolioValues = (): void => {
    setPortfolio((prevPortfolio) =>
      prevPortfolio.map((holding) => {
        const currentStock = marketData.find((item) => item.id === holding.id);
        const currentMarketPrice = currentStock ? currentStock.price : holding.currentPrice;
        return {
          ...holding,
          currentPrice: currentMarketPrice,
          currentValue: currentMarketPrice * holding.quantity,
          pnl: (currentMarketPrice - holding.avgPrice) * holding.quantity,
          pnlPercent: ((currentMarketPrice - holding.avgPrice) / holding.avgPrice) * 100,
        };
      }),
    );
  };

  const recordTransaction = (type: string, stock: Stock | Holding, quantity: number, price: number): void => {
    const transaction: Transaction = {
      id: Date.now(),
      type,
      stock: stock.name,
      symbol: stock.symbol,
      quantity,
      price,
      total: quantity * price,
      timestamp: new Date(),
    };
    setTransactionHistory((prev) => [transaction, ...prev.slice(0, 99)]);
  };

  useEffect(() => {
    // Don't update prices while buy modal is open
    if (showBuyModal) return;
    
    simulatePriceUpdates();
    const interval = setInterval(() => {
      // Don't update prices while buy modal is open
      if (!showBuyModal) {
        simulatePriceUpdates();
      }
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBuyModal]);

  useEffect(() => {
    if (portfolio.length > 0) {
      updatePortfolioValues()
    }
  }, [marketData])

  const handleManualRefresh = (): void => {
    setIsRefreshing(true);
    simulatePriceUpdates();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleBuy = (): void => {
    if (!selectedStock || Number.parseInt(buyQuantity) <= 0) return;

    const quantity = Number.parseInt(buyQuantity);
    // Use frozen price if available (from when modal opened), otherwise use current price
    const buyPrice = frozenStockPrice || selectedStock.price;
    const totalCost = buyPrice * quantity;

    if (totalCost > virtualCash) {
      Alert.alert('Insufficient funds!', `You need ₹${totalCost.toFixed(2)} but only have ₹${virtualCash.toFixed(2)}`);
      return;
    }

    const existingHolding = portfolio.find((p) => p.id === selectedStock.id);

    if (existingHolding) {
      const newQuantity = existingHolding.quantity + quantity;
      const newTotalInvestment = existingHolding.totalInvested + totalCost;
            const newAvgPrice = newTotalInvestment / newQuantity;

      setPortfolio((prev) =>
        prev.map((p) =>
          p.id === selectedStock.id
            ? {
                ...p,
                quantity: newQuantity,
                avgPrice: newAvgPrice,
                totalInvested: newTotalInvestment,
                currentValue: buyPrice * newQuantity,
                pnl: (buyPrice - newAvgPrice) * newQuantity,
                pnlPercent: ((buyPrice - newAvgPrice) / newAvgPrice) * 100,
              }
            : p,
        ),
      );
    } else {
      const newHolding: Holding = {
        id: selectedStock.id,
        name: selectedStock.name,
        symbol: selectedStock.symbol,
        type: selectedStock.type,
        quantity,
        avgPrice: buyPrice,
        currentPrice: buyPrice,
        totalInvested: totalCost,
        currentValue: totalCost,
        pnl: 0,
        pnlPercent: 0,
        sector: selectedStock.sector,
      };
      setPortfolio((prev) => [...prev, newHolding]);
    }

    recordTransaction('BUY', selectedStock, quantity, buyPrice);
    setVirtualCash((prev) => prev - totalCost);
    setTotalInvested((prev) => prev + totalCost);
    setShowBuyModal(false);
    setBuyQuantity('1');
    setSelectedStock(null);
    setFrozenStockPrice(null);
  };

  const handleSell = (holding: Holding, sellQuantity: number): void => {
    if (sellQuantity <= 0 || sellQuantity > holding.quantity) return;

    const saleValue = holding.currentPrice * sellQuantity;
    const remainingQuantity = holding.quantity - sellQuantity;

    if (remainingQuantity === 0) {
      setPortfolio((prev) => prev.filter((p) => p.id !== holding.id));
    } else {
      const newTotalInvested = holding.avgPrice * remainingQuantity;
      setPortfolio((prev) =>
        prev.map((p) =>
          p.id === holding.id
            ? {
                ...p,
                quantity: remainingQuantity,
                totalInvested: newTotalInvested,
                currentValue: holding.currentPrice * remainingQuantity,
                pnl: (holding.currentPrice - holding.avgPrice) * remainingQuantity,
                pnlPercent: ((holding.currentPrice - holding.avgPrice) / holding.avgPrice) * 100,
              }
            : p,
        ),
      );
    }

    recordTransaction('SELL', holding, sellQuantity, holding.currentPrice);
    setVirtualCash((prev) => prev + saleValue);
    const soldInvestment = holding.avgPrice * sellQuantity;
    setTotalInvested((prev) => prev - soldInvestment);
  };

  const addToWatchlist = (stock: Stock): void => {
    if (!watchlist.find((w) => w.id === stock.id)) {
      setWatchlist((prev) => [...prev, stock]);
    }
  };

  const removeFromWatchlist = (stockId: string): void => {
    setWatchlist((prev) => prev.filter((w) => w.id !== stockId));
  };

  const getTotalPortfolioValue = (): number => {
    return portfolio.reduce((sum, holding) => sum + holding.currentValue, 0) + virtualCash;
  };

  const getTotalPnL = (): number => {
    return portfolio.reduce((sum, holding) => sum + holding.pnl, 0);
  };

  const getPortfolioPnLPercent = (): number => {
    if (totalInvested === 0) return 0;
    return (getTotalPnL() / totalInvested) * 100;
  };

  const Dashboard = (): React.JSX.Element => (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleManualRefresh} />}
    >
      {/* Portfolio Summary Cards */}
      <View style={styles.cardsContainer}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total Portfolio Value</Text>
          <Text style={styles.cardValue}>₹{getTotalPortfolioValue().toLocaleString("en-IN")}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Available Cash</Text>
          <Text style={[styles.cardValue, { color: "#16a34a" }]}>₹{virtualCash.toLocaleString("en-IN")}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total P&L</Text>
          <Text style={[styles.cardValue, { color: getTotalPnL() >= 0 ? "#16a34a" : "#dc2626" }]}>
            ₹{getTotalPnL().toLocaleString("en-IN")}
          </Text>
          <Text style={[styles.cardSubValue, { color: getTotalPnL() >= 0 ? "#16a34a" : "#dc2626" }]}>
            ({getPortfolioPnLPercent().toFixed(2)}%)
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total Holdings</Text>
          <Text style={styles.cardValue}>{portfolio.length}</Text>
        </View>
      </View>

      {/* Holdings List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Holdings</Text>
        {portfolio.length === 0 ? (
          <Text style={styles.emptyText}>No holdings yet. Start investing!</Text>
        ) : (
          portfolio.map((holding) => (
            <View key={holding.id} style={styles.holdingItem}>
              <View style={styles.holdingHeader}>
                <View>
                  <Text style={styles.holdingName}>{holding.name}</Text>
                  <Text style={styles.holdingSymbol}>
                    {holding.symbol} • {holding.sector}
                  </Text>
                </View>
                <Text style={[styles.holdingPnL, { color: holding.pnl >= 0 ? "#16a34a" : "#dc2626" }]}>
                  ₹{holding.pnl.toFixed(2)}
                </Text>
              </View>
              <View style={styles.holdingDetails}>
                <View style={styles.detail}>
                  <Text style={styles.detailLabel}>Qty: {holding.quantity}</Text>
                </View>
                <View style={styles.detail}>
                  <Text style={styles.detailLabel}>Avg: ₹{holding.avgPrice.toFixed(2)}</Text>
                </View>
                <View style={styles.detail}>
                  <Text style={styles.detailLabel}>Curr: ₹{holding.currentPrice.toFixed(2)}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.sellButton}
                onPress={() => handleSell(holding, Math.floor(holding.quantity / 2) || 1)}
              >
                <Text style={styles.sellButtonText}>Sell 50%</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Transaction History */}
      {transactionHistory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactionHistory.slice(0, 5).map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <Text
                  style={[
                    styles.transactionType,
                    {
                      color: transaction.type === "BUY" ? "#16a34a" : "#dc2626",
                    },
                  ]}
                >
                  {transaction.type}
                </Text>
                <Text style={styles.transactionSymbol}>{transaction.symbol}</Text>
              </View>
              <View style={styles.transactionRight}>
                <Text style={styles.transactionQty}>
                  {transaction.quantity} @ ₹{transaction.price.toFixed(2)}
                </Text>
                <Text style={styles.transactionTotal}>₹{transaction.total.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )

  const Markets = (): React.JSX.Element => (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleManualRefresh} />}
    >
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search stocks (e.g., RELIANCE, TCS...)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Market Data List */}
      <FlatList
        scrollEnabled={false}
        data={marketData}
        keyExtractor={(item) => item.id}
        renderItem={({ item: instrument }) => (
          <View style={styles.marketItem}>
            <View style={styles.marketHeader}>
              <View>
                <Text style={styles.marketName}>{instrument.name}</Text>
                <Text style={styles.marketSymbol}>
                  {instrument.symbol} • {instrument.sector}
                </Text>
              </View>
              <Text
                style={[
                  styles.marketChange,
                  {
                    color: instrument.changePercent >= 0 ? "#16a34a" : "#dc2626",
                  },
                ]}
              >
                {instrument.changePercent >= 0 ? "+" : ""}
                {instrument.changePercent.toFixed(2)}%
              </Text>
            </View>
            <View style={styles.marketPrice}>
              <Text style={styles.price}>₹{instrument.price.toFixed(2)}</Text>
              <Text style={styles.priceChange}>
                {instrument.change >= 0 ? "+" : ""}₹{instrument.change.toFixed(2)}
              </Text>
            </View>
            <View style={styles.marketInfo}>
              <Text style={styles.infoText}>
                MCap: {instrument.marketCap} | P/E: {instrument.pe}
              </Text>
            </View>
            <View style={styles.marketActions}>
              <TouchableOpacity
                style={styles.buyBtn}
                  onPress={() => {
                    setSelectedStock(instrument);
                    setFrozenStockPrice(instrument.price);
                    setShowBuyModal(true);
                  }}
              >
                <Text style={styles.buyBtnText}>Buy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.watchBtn} onPress={() => addToWatchlist(instrument)}>
                <Text style={styles.watchBtnText}>Watch</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </ScrollView>
  )

  const Watchlist = (): React.JSX.Element => (
    <ScrollView style={styles.container}>
      {watchlist.length === 0 ? (
        <Text style={styles.emptyText}>No instruments in watchlist. Add some from Markets tab!</Text>
      ) : (
        watchlist.map((instrument) => {
          const currentData = marketData.find((item) => item.id === instrument.id) || instrument

          return (
            <View key={instrument.id} style={styles.watchItem}>
              <View style={styles.watchHeader}>
                <View>
                  <Text style={styles.watchName}>{currentData.name}</Text>
                  <Text style={styles.watchSymbol}>{currentData.symbol}</Text>
                </View>
                <Text
                  style={[
                    styles.watchChange,
                    {
                      color: currentData.changePercent >= 0 ? "#16a34a" : "#dc2626",
                    },
                  ]}
                >
                  {currentData.changePercent >= 0 ? "+" : ""}
                  {currentData.changePercent.toFixed(2)}%
                </Text>
              </View>
              <Text style={styles.watchPrice}>₹{currentData.price.toFixed(2)}</Text>
              <View style={styles.watchActions}>
                <TouchableOpacity
                  style={styles.buyBtn}
                  onPress={() => {
                    setSelectedStock(currentData)
                    setShowBuyModal(true)
                  }}
                >
                  <Text style={styles.buyBtnText}>Buy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromWatchlist(instrument.id)}>
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        })
      )}
    </ScrollView>
  )

  const BuyModal = (): React.JSX.Element => (
    <Modal
      visible={showBuyModal}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setShowBuyModal(false);
        setSelectedStock(null);
        setBuyQuantity('1');
        setFrozenStockPrice(null);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {selectedStock && (
            <>
              <Text style={styles.modalTitle}>Buy {selectedStock.name}</Text>

              <View style={styles.modalInfo}>
                <View style={styles.infoPair}>
                  <Text style={styles.infoLabel}>Current Price:</Text>
                  <Text style={styles.infoValue}>
                    ₹{(frozenStockPrice || selectedStock.price).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.infoPair}>
                  <Text style={styles.infoLabel}>Change:</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      {
                        color: (frozenStockPrice ? (selectedStock.changePercent >= 0) : (selectedStock.changePercent >= 0)) ? '#16a34a' : '#dc2626',
                      },
                    ]}
                  >
                    {selectedStock.changePercent >= 0 ? '+' : ''}
                    {selectedStock.changePercent.toFixed(2)}%
                  </Text>
                </View>
              </View>

              <View style={styles.modalCashInfo}>
                <Text style={styles.cashLabel}>Available Cash: ₹{virtualCash.toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.quantityContainer}>
                <Text style={styles.quantityLabel}>Quantity</Text>
                
                {/* Quick Action Buttons */}
                <View style={styles.quickQuantityButtons}>
                  <TouchableOpacity
                    style={styles.quickBtn}
                    onPress={() => {
                      const price = frozenStockPrice || selectedStock.price;
                      const maxAffordable = Math.floor(virtualCash / price);
                      setBuyQuantity(Math.min(10, maxAffordable).toString());
                    }}>
                    <Text style={styles.quickBtnText}>10</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickBtn}
                    onPress={() => {
                      const price = frozenStockPrice || selectedStock.price;
                      const maxAffordable = Math.floor(virtualCash / price);
                      setBuyQuantity(Math.min(25, maxAffordable).toString());
                    }}>
                    <Text style={styles.quickBtnText}>25</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickBtn}
                    onPress={() => {
                      const price = frozenStockPrice || selectedStock.price;
                      const maxAffordable = Math.floor(virtualCash / price);
                      setBuyQuantity(Math.min(50, maxAffordable).toString());
                    }}>
                    <Text style={styles.quickBtnText}>50</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickBtn}
                    onPress={() => {
                      const price = frozenStockPrice || selectedStock.price;
                      const maxAffordable = Math.floor(virtualCash / price);
                      setBuyQuantity(Math.min(100, maxAffordable).toString());
                    }}>
                    <Text style={styles.quickBtnText}>100</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickBtn}
                    onPress={() => {
                      const price = frozenStockPrice || selectedStock.price;
                      const maxAffordable = Math.floor(virtualCash / price);
                      setBuyQuantity(maxAffordable.toString());
                    }}>
                    <Text style={styles.quickBtnText}>Max</Text>
                  </TouchableOpacity>
                </View>
                
                <TextInput
                  style={styles.quantityInput}
                  keyboardType="number-pad"
                  value={buyQuantity}
                  onChangeText={(text) => {
                    // Only allow numeric input
                    if (text === '' || /^\d+$/.test(text)) {
                      setBuyQuantity(text);
                    }
                  }}
                  placeholder="1"
                  autoFocus={true}
                  selectTextOnFocus={true}
                />
                <Text style={styles.maxAffordable}>
                  Max affordable: {Math.floor(virtualCash / (frozenStockPrice || selectedStock.price))} shares
                </Text>
              </View>

              <View style={styles.totalCostContainer}>
                <Text style={styles.totalLabel}>Total Cost:</Text>
                <Text style={styles.totalValue}>
                  ₹{((frozenStockPrice || selectedStock.price) * (Number.parseInt(buyQuantity) || 0)).toFixed(2)}
                </Text>
              </View>

              <View style={styles.remainingCash}>
                <Text style={styles.remainingLabel}>Remaining Cash:</Text>
                <Text style={styles.remainingValue}>
                  ₹{(virtualCash - (frozenStockPrice || selectedStock.price) * (Number.parseInt(buyQuantity) || 0)).toFixed(2)}
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[
                    styles.buyModalBtn,
                    {
                      opacity:
                        (frozenStockPrice || selectedStock.price) * (Number.parseInt(buyQuantity) || 0) > virtualCash ||
                        Number.parseInt(buyQuantity) <= 0
                          ? 0.5
                          : 1,
                    },
                  ]}
                  onPress={handleBuy}
                  disabled={
                    (frozenStockPrice || selectedStock.price) * (Number.parseInt(buyQuantity) || 0) > virtualCash ||
                    Number.parseInt(buyQuantity) <= 0
                  }
                >
                  <Text style={styles.buyModalBtnText}>
                    Buy {Number.parseInt(buyQuantity) || 0} Share
                    {Number.parseInt(buyQuantity) > 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => {
                    setShowBuyModal(false);
                    setSelectedStock(null);
                    setBuyQuantity('1');
                    setFrozenStockPrice(null);
                  }}
                >
                  <Text style={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  )

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Portfolio Simulator</Text>
          <Text style={styles.headerSubtitle}>Learn investing with real data</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerCashLabel}>Virtual Cash</Text>
          <Text style={styles.headerCashValue}>₹{virtualCash.toLocaleString("en-IN")}</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNav}>
        {([
          { id: 'dashboard' as const, label: '📊 Dashboard' },
          { id: 'markets' as const, label: '📈 Markets' },
          { id: 'watchlist' as const, label: '👁️ Watchlist' },
        ] as const).map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}>
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'markets' && <Markets />}
      {activeTab === 'watchlist' && <Watchlist />}

      {/* Buy Modal */}
      <BuyModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerCashLabel: {
    fontSize: 12,
    color: "#666",
  },
  headerCashValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#16a34a",
    marginTop: 2,
  },
  tabNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#2563eb",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "#2563eb",
  },
  container: {
    flex: 1,
    padding: 12,
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  cardLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  cardSubValue: {
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingVertical: 20,
  },
  holdingItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  holdingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  holdingName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  holdingSymbol: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  holdingPnL: {
    fontSize: 14,
    fontWeight: "bold",
  },
  holdingDetails: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  detail: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: "#666",
  },
  sellButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  sellButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  transactionLeft: {
    flex: 1,
  },
  transactionType: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },
  transactionSymbol: {
    fontSize: 11,
    color: "#666",
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionQty: {
    fontSize: 11,
    color: "#666",
    marginBottom: 2,
  },
  transactionTotal: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000",
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  marketItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  marketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  marketName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  marketSymbol: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  marketChange: {
    fontSize: 14,
    fontWeight: "bold",
  },
  marketPrice: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  priceChange: {
    fontSize: 12,
    color: "#666",
  },
  marketInfo: {
    marginBottom: 10,
  },
  infoText: {
    fontSize: 11,
    color: "#666",
  },
  marketActions: {
    flexDirection: "row",
    gap: 8,
  },
  buyBtn: {
    flex: 1,
    backgroundColor: "#16a34a",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  buyBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  watchBtn: {
    flex: 1,
    backgroundColor: "#2563eb",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  watchBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  watchItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  watchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  watchName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  watchSymbol: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  watchChange: {
    fontSize: 14,
    fontWeight: "bold",
  },
  watchPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
  },
  watchActions: {
    flexDirection: "row",
    gap: 8,
  },
  removeBtn: {
    flex: 1,
    backgroundColor: "#dc2626",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  removeBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 16,
  },
  modalInfo: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoPair: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  modalCashInfo: {
    marginBottom: 12,
  },
  cashLabel: {
    fontSize: 13,
    color: "#666",
  },
  quantityContainer: {
    marginBottom: 12,
  },
  quantityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  quickQuantityButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  quickBtn: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    minWidth: 50,
    alignItems: 'center',
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: '#f9fafb',
    marginBottom: 6,
  },
  maxAffordable: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  totalCostContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#dbeafe",
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 13,
    color: "#666",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  remainingCash: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  remainingLabel: {
    fontSize: 12,
    color: "#666",
  },
  remainingValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000",
  },
  modalActions: {
    gap: 8,
  },
  buyModalBtn: {
    backgroundColor: "#16a34a",
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  buyModalBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  cancelModalBtn: {
    backgroundColor: "#666",
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  cancelModalBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
})

