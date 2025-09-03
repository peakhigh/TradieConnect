import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { Input } from './Input';
import { theme } from '../../theme/theme';

export interface SearchBarProps {
  searchInput: string;
  onSearchInputChange: (text: string) => void;
  onSearch: () => void;
  onClear: () => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchInput,
  onSearchInputChange,
  onSearch,
  onClear,
  placeholder = "Search..."
}) => {
  return (
    <View style={styles.searchRow}>
      <View style={styles.searchInputContainer}>
        <Input
          placeholder={placeholder}
          value={searchInput}
          onChangeText={onSearchInputChange}
          onSubmitEditing={onSearch}
          containerStyle={{ marginBottom: 0 }}
          style={styles.searchInputWithIcon}
        />
        {searchInput ? (
          <TouchableOpacity style={styles.clearIconButton} onPress={onClear}>
            <Text style={styles.clearIcon}>×</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <TouchableOpacity style={styles.searchButton} onPress={onSearch}>
        <Search size={20} color={theme.colors.text.inverse} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  searchInputContainer: {
    flex: 1,
    position: 'relative',
  },
  searchInputWithIcon: {
    paddingRight: 40,
  },
  clearIconButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearIcon: {
    fontSize: 20,
    color: theme.colors.text.secondary,
    fontWeight: 'bold',
  },
  searchButton: {
    width: theme.minHeight.input,
    height: theme.minHeight.input,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
  },
});