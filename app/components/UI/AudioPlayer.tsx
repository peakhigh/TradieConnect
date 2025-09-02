import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Pause, Volume2 } from 'lucide-react-native';
import { Audio } from 'expo-av';

interface AudioPlayerProps {
  audioUrl: string;
  compact?: boolean;
  style?: any;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  compact = false,
  style
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const loadAudio = async () => {
    try {
      setIsLoading(true);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false }
      );
      
      setSound(newSound);
      
      // Set up position updates first
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis || 0);
          setIsPlaying(status.isPlaying || false);
          
          // Set duration when available
          if (status.durationMillis && duration === 0) {
            setDuration(status.durationMillis);
          }
          
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPosition(0);
          }
        }
      });
      
      // Wait a bit for the audio to be fully loaded
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Get duration after loading
      const status = await newSound.getStatusAsync();
      if (status.isLoaded && status.durationMillis) {
        setDuration(status.durationMillis);
      }
      
      setIsLoading(false);
      return newSound;
      
    } catch (error) {
      console.error('Error loading audio:', error);
      setIsLoading(false);
      return null;
    }
  };

  const togglePlayback = async () => {
    try {
      if (!sound) {
        const newSound = await loadAudio();
        if (newSound) {
          await newSound.playAsync();
        }
        return;
      }

      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const stopPlayback = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        setPosition(0);
      }
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  };

  const formatTime = (milliseconds: number) => {
    if (!milliseconds || milliseconds === 0 || !isFinite(milliseconds)) {
      return '0:00';
    }
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <TouchableOpacity 
          style={styles.compactButton}
          onPress={togglePlayback}
          disabled={isLoading}
        >
          <Volume2 size={16} color="#3b82f6" />
          <Text style={styles.compactText}>
            {isLoading ? 'Loading...' : isPlaying ? 'Playing...' : 'Voice Message'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={styles.playButton}
        onPress={togglePlayback}
        disabled={isLoading}
      >
        {isPlaying ? (
          <Pause size={24} color="#ffffff" />
        ) : (
          <Play size={24} color="#ffffff" />
        )}
      </TouchableOpacity>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[styles.progressFill, { width: `${progressPercentage}%` }]} 
          />
        </View>
        
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>
      
      <View style={styles.controlsContainer}>
        {isPlaying && (
          <TouchableOpacity 
            style={styles.stopButton}
            onPress={stopPlayback}
          >
            <Text style={styles.stopText}>Stop</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  compactContainer: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  compactText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
  },
  controlsContainer: {
    width: 60,
    alignItems: 'flex-end',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  stopButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#dc2626',
    borderRadius: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  stopText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
});