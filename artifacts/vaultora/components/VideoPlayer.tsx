import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, TouchableOpacity, View, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

const { width: SW, height: SH } = Dimensions.get('window');

interface VideoPlayerProps {
  uri: string;
  paused?: boolean;
}

// Video player using expo-av (dynamically required to handle missing native module gracefully)
export default function VideoPlayer({ uri, paused = false }: VideoPlayerProps) {
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState('');
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<any>(null);

  // Try to load expo-av dynamically
  const [Video, setVideo] = useState<any>(null);
  const [ResizeMode, setResizeMode] = useState<any>(null);

  useEffect(() => {
    try {
      const av = require('expo-av');
      setVideo(() => av.Video);
      setResizeMode(av.ResizeMode);
    } catch {
      setError('Video playback not available in this environment');
    }
  }, []);

  useEffect(() => {
    if (paused && videoRef.current?.pauseAsync) {
      videoRef.current.pauseAsync().catch(() => {});
      setIsPlaying(false);
    }
  }, [paused]);

  const togglePlay = useCallback(async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await videoRef.current.playAsync();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleSeek = useCallback(async (ratio: number) => {
    if (!videoRef.current || !duration) return;
    const pos = ratio * duration;
    await videoRef.current.setPositionAsync(pos);
    setPosition(pos);
  }, [duration]);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  };

  if (error || !Video) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="videocam-off-outline" size={40} color="rgba(255,255,255,0.4)" />
        <Text style={styles.errorText}>
          {error || 'Video player requires a development build'}
        </Text>
      </View>
    );
  }

  return (
    <Pressable style={styles.container} onPress={() => setShowControls(s => !s)}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode={ResizeMode?.CONTAIN ?? 'contain'}
        shouldPlay={false}
        isLooping={false}
        onLoadStart={() => setIsLoading(true)}
        onLoad={(status: any) => {
          setIsLoading(false);
          if (status.durationMillis) setDuration(status.durationMillis);
        }}
        onPlaybackStatusUpdate={(status: any) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying ?? false);
            setPosition(status.positionMillis ?? 0);
          }
        }}
        onError={(e: any) => {
          setIsLoading(false);
          setError('Could not play this video');
        }}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#C4975A" />
        </View>
      )}

      {showControls && !isLoading && (
        <View style={styles.controls}>
          {/* Progress bar */}
          <Pressable
            style={styles.progressBar}
            onPress={(e) => {
              const ratio = e.nativeEvent.locationX / SW;
              handleSeek(Math.max(0, Math.min(1, ratio)));
            }}
          >
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${duration ? (position / duration) * 100 : 0}%` }]} />
            </View>
          </Pressable>

          {/* Time */}
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>

          {/* Play/Pause */}
          <View style={styles.playRow}>
            <TouchableOpacity onPress={togglePlay} style={styles.playBtn}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={36} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { width: SW, height: SH, backgroundColor: '#000' },
  video: { width: '100%', height: '100%' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  controls: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 16,
  },
  progressBar: { height: 20, justifyContent: 'center', marginBottom: 4 },
  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: '#C4975A', borderRadius: 2 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  timeText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  playRow: { alignItems: 'center' },
  playBtn: { padding: 8 },
});
