import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Pause, Square } from 'lucide-react-native';

interface VoicePlayerProps {
  voiceUrl: string;
  style?: any;
  compact?: boolean;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({ 
  voiceUrl, 
  style,
  compact = false 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sound, setSound] = useState<any>(null);

  const playVoice = async () => {
    try {
      if (isPaused && sound) {
        await sound.playAsync();
        setIsPlaying(true);
        setIsPaused(false);
        return;
      }

      const { Audio } = await import('expo-av');
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: voiceUrl });
      
      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.durationMillis) {
          setProgress(status.positionMillis / status.durationMillis);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setIsPaused(false);
            setProgress(0);
            setSound(null);
          }
        }
      });
      
      setSound(newSound);
      setIsPlaying(true);
      await newSound.playAsync();
    } catch (error) {
      console.error('Error playing voice:', error);
    }
  };

  const pauseVoice = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
      setIsPaused(true);
    }
  };

  const stopVoice = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {!isPlaying && !isPaused && !sound ? (
        <TouchableOpacity style={styles.playButton} onPress={playVoice}>
          <Play size={16} color="#3b82f6" />
          <Text style={styles.playButtonText}>Play Voice Message</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.controlButton} onPress={isPlaying ? pauseVoice : playVoice}>
            {isPlaying ? <Pause size={16} color="#3b82f6" /> : <Play size={16} color="#3b82f6" />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={stopVoice}>
            <Square size={16} color="#dc2626" />
          </TouchableOpacity>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress * 100).toString()}%</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  playButtonText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  controlButton: {
    padding: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    flex: 1,
    marginHorizontal: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    minWidth: 35,
  },
});