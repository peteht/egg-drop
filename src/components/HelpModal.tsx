import React from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const RULES = [
  {
    emoji: '📏',
    title: 'Drop from at least 1 meter',
    body: 'Short drops underestimate impact force. The app may show "safe" when the egg would actually crack.',
  },
  {
    emoji: '🖐️',
    title: 'Full release — don\'t guide it',
    body: 'Hold the phone loosely and let go completely. Gripping or pushing during the drop skews the g reading.',
  },
  {
    emoji: '🚶',
    title: 'Step back and let it land',
    body: 'Don\'t catch it or nudge it after landing. A bounce or roll can crack an egg at low g that the sensor won\'t catch.',
  },
  {
    emoji: '⬇️',
    title: 'Drop straight down',
    body: 'Throwing or angling the phone changes the velocity calculation and throws off the result.',
  },
  {
    emoji: '🥚',
    title: 'Put the phone where the egg would go',
    body: 'The app measures what the phone experiences. Position it inside your armor the same way you\'d position a real egg.',
  },
];

export default function HelpModal({ visible, onClose }: Props): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>How to get accurate results</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {RULES.map((rule) => (
              <View key={rule.title} style={styles.rule}>
                <Text style={styles.ruleEmoji}>{rule.emoji}</Text>
                <View style={styles.ruleText}>
                  <Text style={styles.ruleTitle}>{rule.title}</Text>
                  <Text style={styles.ruleBody}>{rule.body}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  box: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2D2D2D',
    marginBottom: 20,
  },
  scroll: {
    marginBottom: 20,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
    gap: 14,
  },
  ruleEmoji: {
    fontSize: 28,
    marginTop: 2,
  },
  ruleText: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D2D2D',
    marginBottom: 3,
  },
  ruleBody: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  closeBtn: {
    backgroundColor: '#F5C842',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2D2D2D',
  },
});
