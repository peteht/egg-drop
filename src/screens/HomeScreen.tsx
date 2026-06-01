import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import HelpModal from '../components/HelpModal';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EggSpec {
  x: number;
  y: number;
  scale: number;
  rot: number;
  cracked: boolean;
}

type EggProps = Omit<EggSpec, 'cracked'>;

const EGGS: EggSpec[] = [
  { x: 18,  y: 60, scale: 0.38, rot: -25,  cracked: true  },
  { x: 58,  y: 75, scale: 0.30, rot: 10,   cracked: false },
  { x: 95,  y: 55, scale: 0.42, rot: -8,   cracked: true  },
  { x: 138, y: 70, scale: 0.33, rot: 30,   cracked: false },
  { x: 175, y: 52, scale: 0.45, rot: -40,  cracked: true  },
  { x: 218, y: 68, scale: 0.31, rot: 15,   cracked: false },
  { x: 258, y: 58, scale: 0.40, rot: -18,  cracked: true  },
  { x: 300, y: 74, scale: 0.28, rot: 50,   cracked: false },
  { x: 338, y: 50, scale: 0.44, rot: -30,  cracked: true  },
  { x: 375, y: 70, scale: 0.35, rot: 5,    cracked: false },
  { x: 38,  y: 20, scale: 0.26, rot: 20,   cracked: false },
  { x: 120, y: 18, scale: 0.32, rot: -50,  cracked: true  },
  { x: 200, y: 22, scale: 0.28, rot: 35,   cracked: false },
  { x: 280, y: 16, scale: 0.36, rot: -15,  cracked: true  },
  { x: 355, y: 24, scale: 0.29, rot: 45,   cracked: false },
];

const EGG_PATH =
  'M 80,8 C 115,8 148,55 148,115 C 148,168 118,202 80,202 C 42,202 12,168 12,115 C 12,55 45,8 80,8 Z';

function WholeEgg({ x, y, scale, rot }: EggProps): React.JSX.Element {
  return (
    <G transform={`translate(${x},${y}) rotate(${rot}) scale(${scale}) translate(-80,-105)`}>
      <Path d={EGG_PATH} fill="#F5C842" />
      <Ellipse cx="105" cy="45" rx="12" ry="20" fill="rgba(255,255,255,0.25)" transform="rotate(-20,105,45)" />
    </G>
  );
}

function CrackedEgg({ x, y, scale, rot }: EggProps): React.JSX.Element {
  return (
    <G transform={`translate(${x},${y}) rotate(${rot}) scale(${scale}) translate(-80,-60)`}>
      <Circle cx="80" cy="52" r="28" fill="#F5A623" />
      <Circle cx="80" cy="52" r="22" fill="#F5C842" />
      <Path
        d="M 80,8 C 55,8 30,35 18,65 L 45,58 L 60,72 L 75,55 L 80,65 Z"
        fill="#FFF8E7"
        stroke="#E0C060"
        strokeWidth="2"
      />
      <Path
        d="M 80,8 C 105,8 130,35 142,65 L 115,58 L 100,72 L 85,55 L 80,65 Z"
        fill="#FFF8E7"
        stroke="#E0C060"
        strokeWidth="2"
      />
    </G>
  );
}

function EggLitter(): React.JSX.Element {
  return (
    <View style={styles.litterContainer} pointerEvents="none">
      <Svg width={SCREEN_WIDTH} height={100} viewBox={`0 0 ${SCREEN_WIDTH} 100`}>
        {EGGS.map((egg, i) =>
          egg.cracked
            ? <CrackedEgg key={i} x={egg.x} y={egg.y} scale={egg.scale} rot={egg.rot} />
            : <WholeEgg   key={i} x={egg.x} y={egg.y} scale={egg.scale} rot={egg.rot} />
        )}
      </Svg>
    </View>
  );
}

export default function HomeScreen({ navigation }: Props): React.JSX.Element {
  const wobble = useRef(new Animated.Value(0)).current;
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(wobble, { toValue: 1,  duration: 1200, useNativeDriver: true }),
        Animated.timing(wobble, { toValue: -1, duration: 1200, useNativeDriver: true }),
        Animated.timing(wobble, { toValue: 0,  duration: 600,  useNativeDriver: true }),
      ])
    ).start();
  }, [wobble]);

  const rotate = wobble.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-8deg', '8deg'],
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.helpBtn} onPress={() => setShowHelp(true)}>
        <Text style={styles.helpBtnText}>?</Text>
      </TouchableOpacity>
      <HelpModal visible={showHelp} onClose={() => setShowHelp(false)} />
      <Text style={styles.title}>Egg Drop</Text>
      <Text style={styles.subtitle}>
        Wrap your phone, then drop it.{'\n'}We'll tell you if the egg survives.
      </Text>

      <Animated.View style={{ transform: [{ rotate }] }}>
        <TouchableOpacity onPress={() => navigation.navigate('Drop')} activeOpacity={0.85}>
          <Svg width={240} height={315} viewBox="0 0 160 210">
            <Path d={EGG_PATH} fill="#F5C842" />
            <Ellipse cx="108" cy="60" rx="14" ry="26" fill="rgba(255,255,255,0.2)" transform="rotate(-20,108,60)" />
          </Svg>
          <View style={styles.eggLabelOverlay}>
            <Text style={styles.eggEmoji}>🥚</Text>
            <Text style={styles.eggLabel}>Start Drop</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity style={styles.historyLink} onPress={() => navigation.navigate('History')}>
        <Text style={styles.historyLinkText}>View History</Text>
      </TouchableOpacity>


      <EggLitter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#2D2D2D',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 56,
    lineHeight: 26,
  },
  eggLabelOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eggEmoji: {
    fontSize: 52,
    marginBottom: 8,
  },
  eggLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D2D2D',
  },
  historyLink: {
    marginTop: 48,
  },
  historyLinkText: {
    fontSize: 17,
    color: '#888',
    textDecorationLine: 'underline',
  },
  litterContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  helpBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  helpBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#999',
  },
});
