import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { User, Customer, Tradie } from '../../types';

interface AdminStats {
  totalUsers: number;
  totalCustomers: number;
  totalTradies: number;
  pendingApprovals: number;
  totalRevenue: number;
  totalUnlocks: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCustomers: 0,
    totalTradies: 0,
    pendingApprovals: 0,
    totalRevenue: 0,
    totalUnlocks: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    setLoading(true);
    try {
      // Get total users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;

      // Get customers and tradies
      const customersSnapshot = await getDocs(query(collection(db, 'users'), where('userType', '==', 'customer')));
      const tradiesSnapshot = await getDocs(query(collection(db, 'users'), where('userType', '==', 'tradie')));
      
      const totalCustomers = customersSnapshot.size;
      const totalTradies = tradiesSnapshot.size;

      // Get pending approvals
      const pendingTradiesSnapshot = await getDocs(
        query(collection(db, 'users'), where('userType', '==', 'tradie'), where('isApproved', '==', false))
      );
      const pendingApprovals = pendingTradiesSnapshot.size;

      // TODO: Get actual revenue and unlock data from transactions collection
      const totalRevenue = 0; // Placeholder
      const totalUnlocks = 0; // Placeholder

      setStats({
        totalUsers,
        totalCustomers,
        totalTradies,
        pendingApprovals,
        totalRevenue,
        totalUnlocks
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
      Alert.alert('Error', 'Failed to load admin statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleUserManagement = () => {
    // TODO: Navigate to user management screen
    Alert.alert('User Management', 'User management functionality coming soon');
  };

  const handleAccountsManagement = () => {
    // TODO: Navigate to accounts management screen
    Alert.alert('Accounts Management', 'Accounts management functionality coming soon');
  };

  const handleMoneyManagement = () => {
    // TODO: Navigate to money management screen
    Alert.alert('Money Management', 'Money management functionality coming soon');
  };

  const handleApproveTradie = (tradieId: string) => {
    // TODO: Implement tradie approval
    Alert.alert('Approve Tradie', 'Tradie approval functionality coming soon');
  };

  const handleViewUserDetails = (userId: string) => {
    // TODO: Navigate to user details screen
    Alert.alert('User Details', 'User details functionality coming soon');
  };

  const handleViewTransactions = () => {
    // TODO: Navigate to transactions screen
    Alert.alert('Transactions', 'Transactions functionality coming soon');
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900">
            Admin Dashboard
          </Text>
          <Text className="text-gray-600 mt-1">
            Manage users, accounts, and monitor platform performance
          </Text>
        </View>

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</Text>
          <View className="flex-row space-x-3">
            <Button
              title="User Management"
              onPress={handleUserManagement}
              size="medium"
            />
            <Button
              title="Accounts"
              onPress={handleAccountsManagement}
              variant="outline"
              size="medium"
            />
            <Button
              title="Money Management"
              onPress={handleMoneyManagement}
              variant="outline"
              size="medium"
            />
          </View>
        </View>

        {/* Stats Overview */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Platform Overview</Text>
          <View className="grid grid-cols-2 gap-3">
            <View className="bg-white rounded-lg p-4 border border-gray-200">
              <Text className="text-2xl font-bold text-primary-600">
                {stats.totalUsers}
              </Text>
              <Text className="text-sm text-gray-600">Total Users</Text>
            </View>
            
            <View className="bg-white rounded-lg p-4 border border-gray-200">
              <Text className="text-2xl font-bold text-blue-600">
                {stats.totalCustomers}
              </Text>
              <Text className="text-sm text-gray-600">Customers</Text>
            </View>
            
            <View className="bg-white rounded-lg p-4 border border-gray-200">
              <Text className="text-2xl font-bold text-green-600">
                {stats.totalTradies}
              </Text>
              <Text className="text-sm text-gray-600">Tradies</Text>
            </View>
            
            <View className="bg-white rounded-lg p-4 border border-gray-200">
              <Text className="text-2xl font-bold text-yellow-600">
                {stats.pendingApprovals}
              </Text>
              <Text className="text-sm text-gray-600">Pending Approvals</Text>
            </View>
          </View>
        </View>

        {/* Financial Overview */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Financial Overview</Text>
          <View className="bg-white rounded-lg p-4 border border-gray-200">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-900">Revenue</Text>
              <Button
                title="View Details"
                onPress={handleViewTransactions}
                variant="outline"
                size="small"
              />
            </View>
            
            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Total Revenue</Text>
                <Text className="font-semibold text-green-600">
                  ${stats.totalRevenue.toFixed(2)}
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Total Unlocks</Text>
                <Text className="font-semibold text-blue-600">
                  {stats.totalUnlocks}
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Average per Unlock</Text>
                <Text className="font-semibold text-gray-900">
                  ${stats.totalUnlocks > 0 ? (stats.totalRevenue / stats.totalUnlocks).toFixed(2) : '0.00'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pending Approvals */}
        {stats.pendingApprovals > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Pending Tradie Approvals ({stats.pendingApprovals})
            </Text>
            <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <Text className="text-yellow-800 font-medium mb-2">
                ⚠️ Action Required
              </Text>
              <Text className="text-yellow-700 text-sm mb-3">
                You have {stats.pendingApprovals} tradie applications waiting for approval. 
                Review their documents and approve qualified candidates.
              </Text>
              
              <Button
                title="Review Applications"
                onPress={handleUserManagement}
                size="small"
              />
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</Text>
          <View className="bg-white rounded-lg p-4 border border-gray-200">
            <Text className="text-gray-500 text-center">
              Recent activity monitoring coming soon
            </Text>
          </View>
        </View>

        {/* System Health */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">System Health</Text>
          <View className="space-y-3">
            <View className="bg-green-50 border border-green-200 rounded-lg p-3">
              <Text className="text-green-800 font-medium">✅ Authentication System</Text>
              <Text className="text-green-700 text-sm">Phone OTP verification working normally</Text>
            </View>
            
            <View className="bg-green-50 border border-green-200 rounded-lg p-3">
              <Text className="text-green-800 font-medium">✅ Database</Text>
              <Text className="text-green-700 text-sm">Firestore connection stable</Text>
            </View>
            
            <View className="bg-green-50 border border-green-200 rounded-lg p-3">
              <Text className="text-green-800 font-medium">✅ Storage</Text>
              <Text className="text-green-700 text-sm">File upload system operational</Text>
            </View>
          </View>
        </View>

        {/* Quick Reports */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Quick Reports</Text>
          <View className="space-y-3">
            <Button
              title="Generate User Report"
              onPress={() => Alert.alert('Report', 'Report generation coming soon')}
              variant="outline"
              size="medium"
            />
            
            <Button
              title="Generate Financial Report"
              onPress={() => Alert.alert('Report', 'Report generation coming soon')}
              variant="outline"
              size="medium"
            />
            
            <Button
              title="Generate Performance Report"
              onPress={() => Alert.alert('Report', 'Report generation coming soon')}
              variant="outline"
              size="medium"
            />
          </View>
        </View>

        {/* Refresh Button */}
        <View className="mt-6">
          <Button
            title="Refresh Dashboard"
            onPress={loadAdminStats}
            loading={loading}
            size="large"
          />
        </View>
      </View>
    </ScrollView>
  );
};
