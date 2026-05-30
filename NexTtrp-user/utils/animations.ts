/**
 * @file utils/animations.ts
 * @description Shared NEXTTRP Animated API hooks.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, type GestureResponderEvent } from 'react-native';

export function use3DCard(): {
  animatedStyle: {
    transform: (
      | { scale: Animated.Value }
      | { rotateX: Animated.AnimatedInterpolation<string> }
    )[];
  };
  onPressIn: (event?: GestureResponderEvent) => void;
  onPressOut: (event?: GestureResponderEvent) => void;
} {
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const onPressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.96,
        useNativeDriver: true,
        friction: 8,
        tension: 140,
      }),
      Animated.spring(rotate, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 140,
      }),
    ]).start();
  }, [rotate, scale]);

  const onPressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
        tension: 120,
      }),
      Animated.spring(rotate, {
        toValue: 0,
        useNativeDriver: true,
        friction: 7,
        tension: 120,
      }),
    ]).start();
  }, [rotate, scale]);

  const rotateX = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '4deg'],
  });

  const animatedStyle = useMemo(
    () => ({ transform: [{ scale }, { rotateX }] }),
    [rotateX, scale]
  );

  return { animatedStyle, onPressIn, onPressOut };
}

export function useShimmer(): Animated.Value {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );

    animation.start();
    return () => animation.stop();
  }, [progress]);

  return progress;
}

export function useSlideUp(delay = 0): {
  animatedStyle: {
    opacity: Animated.Value;
    transform: { translateY: Animated.Value }[];
  };
} {
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  const animatedStyle = useMemo(
    () => ({ opacity, transform: [{ translateY }] }),
    [opacity, translateY]
  );

  return { animatedStyle };
}

export function useHeartBounce(): {
  animatedStyle: { transform: { scale: Animated.Value }[] };
  trigger: () => void;
} {
  const scale = useRef(new Animated.Value(1)).current;

  const trigger = useCallback(() => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.4,
        useNativeDriver: true,
        friction: 4,
        tension: 180,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 160,
      }),
    ]).start();
  }, [scale]);

  const animatedStyle = useMemo(
    () => ({ transform: [{ scale }] }),
    [scale]
  );

  return { animatedStyle, trigger };
}

export function usePulse(): {
  animatedStyle: { transform: { scale: Animated.Value }[] };
} {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [scale]);

  const animatedStyle = useMemo(
    () => ({ transform: [{ scale }] }),
    [scale]
  );

  return { animatedStyle };
}
