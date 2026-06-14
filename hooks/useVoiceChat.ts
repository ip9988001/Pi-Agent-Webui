"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface SpeechRecognitionResultItemLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal?: boolean;
  readonly 0: SpeechRecognitionResultItemLike;
  length: number;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type RecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    webkitSpeechRecognition?: RecognitionCtor;
    SpeechRecognition?: RecognitionCtor;
  }
}

export interface VoiceOption {
  name: string;
  lang: string;
}

export type VoiceBubbleMode = "listening" | "confirming" | "holding";

export interface VoiceChatController {
  enabled: boolean;
  isRecording: boolean;
  speechEnabled: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  autoSpeakEnabled: boolean;
  autoSendEnabled: boolean;
  language: string;
  selectedVoice: string;
  rate: number;
  volume: number;
  supportedRecognition: boolean;
  supportedSpeech: boolean;
  errorMessage: string | null;
  voices: VoiceOption[];
  bubbleMode: VoiceBubbleMode | null;
  bubbleText: string;
  pendingCountdown: number | null;
  toggleEnabled: () => void;
  toggleRecording: () => void;
  toggleSpeechEnabled: () => void;
  toggleAutoSpeak: () => void;
  toggleAutoSend: () => void;
  setLanguage: (language: string) => void;
  setSelectedVoice: (voiceName: string) => void;
  setRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  speakText: (text: string) => void;
  pauseOrResumeSpeech: () => void;
  stopSpeaking: () => void;
  cancelPendingSend: () => void;
  clearError: () => void;
}

interface PersistedSettings {
  enabled: boolean;
  speechEnabled: boolean;
  autoSpeakEnabled: boolean;
  autoSendEnabled: boolean;
  language: string;
  selectedVoice: string;
  rate: number;
  volume: number;
}

interface UseVoiceChatOptions {
  onTranscript: (text: string, sendImmediately?: boolean) => void;
  canStartPushToTalk?: () => boolean;
}

const STORAGE_KEY = "pi-voice-chat-settings";
const DEFAULT_SETTINGS: PersistedSettings = {
  enabled: false,
  speechEnabled: true,
  autoSpeakEnabled: true,
  autoSendEnabled: false,
  language: "zh-CN",
  selectedVoice: "",
  rate: 1.8,
  volume: 1,
};
const AUTO_SEND_DELAY_MS = 3000;
const CTRL_HOLD_DELAY_MS = 120;

const PUNCTUATION_MAP: Array<[string, string]> = [
  ["逗号", "，"],
  ["句号", "。"],
  ["问号", "？"],
  ["感叹号", "！"],
  ["冒号", "："],
  ["分号", "；"],
  ["换行", "\n"],
  ["新行", "\n"],
];

function loadSettings(): PersistedSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(stored) as Partial<PersistedSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persistSettings(settings: PersistedSettings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

function normalizeTranscript(raw: string): string {
  let next = raw.trim();
  for (const [keyword, replacement] of PUNCTUATION_MAP) {
    next = next.replaceAll(keyword, replacement);
  }
  return next.replace(/\s+/g, " ").trim();
}

function createRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor();
}

function cleanSpeechText(text: string): string {
  const stripped = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\bhttps?:\/\/\S+/gi, " ")
    .replace(/[A-Za-z]:\\[^\s]+/g, " ")
    .replace(/\/[A-Za-z0-9._/-]+/g, " ")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!stripped) return "";

  const chunks = stripped
    .split(/(?<=[。！？!?])\s+|(?<=\.)\s+(?=[A-Z])/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^(bash|powershell|json|yaml|xml|html|css|tsx?|jsx?)$/i.test(part))
    .filter((part) => !/[{}[\]<>]{3,}/.test(part));

  return chunks
    .slice(0, 3)
    .map((part) => (part.length > 90 ? `${part.slice(0, 88)}…` : part))
    .join(" ")
    .trim();
}

function ensureTrailingComma(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (/[，。！？；：]$/.test(trimmed)) return trimmed;
  return `${trimmed}，`;
}

function ensureTrailingPeriod(text: string): string {
  const trimmed = text.trim().replace(/[，；：、]+$/g, "");
  if (!trimmed) return "";
  if (/[。！？]$/.test(trimmed)) return trimmed;
  return `${trimmed}。`;
}

export function useVoiceChat({ onTranscript, canStartPushToTalk }: UseVoiceChatOptions): VoiceChatController {
  const persisted = useMemo(loadSettings, []);
  const [enabled, setEnabled] = useState(persisted.enabled);
  const [isRecording, setIsRecording] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(persisted.speechEnabled);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(persisted.autoSpeakEnabled);
  const [autoSendEnabled, setAutoSendEnabled] = useState(persisted.autoSendEnabled);
  const [language, setLanguageState] = useState(persisted.language);
  const [selectedVoice, setSelectedVoiceState] = useState(persisted.selectedVoice);
  const [rate, setRateState] = useState(persisted.rate);
  const [volume, setVolumeState] = useState(persisted.volume);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bubbleMode, setBubbleMode] = useState<VoiceBubbleMode | null>(null);
  const [bubbleText, setBubbleText] = useState("");
  const [pendingCountdown, setPendingCountdown] = useState<number | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(typeof window !== "undefined" ? window.speechSynthesis : null);
  const onTranscriptRef = useRef(onTranscript);
  const canStartPushToTalkRef = useRef(canStartPushToTalk);

  const committedSegmentsRef = useRef<string[]>([]);
  const interimTextRef = useRef("");
  const pendingTranscriptRef = useRef("");
  const pendingSendTimeoutRef = useRef<number | null>(null);
  const pendingCountdownIntervalRef = useRef<number | null>(null);
  const ctrlHoldTimerRef = useRef<number | null>(null);
  const ctrlHeldRef = useRef(false);
  const recognitionLiveRef = useRef(false);

  onTranscriptRef.current = onTranscript;
  canStartPushToTalkRef.current = canStartPushToTalk;

  const clearPendingTimers = useCallback(() => {
    if (pendingSendTimeoutRef.current !== null) {
      window.clearTimeout(pendingSendTimeoutRef.current);
      pendingSendTimeoutRef.current = null;
    }
    if (pendingCountdownIntervalRef.current !== null) {
      window.clearInterval(pendingCountdownIntervalRef.current);
      pendingCountdownIntervalRef.current = null;
    }
    setPendingCountdown(null);
  }, []);

  const clearCtrlHoldTimer = useCallback(() => {
    if (ctrlHoldTimerRef.current !== null) {
      window.clearTimeout(ctrlHoldTimerRef.current);
      ctrlHoldTimerRef.current = null;
    }
  }, []);

  const resetBubble = useCallback(() => {
    setBubbleMode(null);
    setBubbleText("");
    setPendingCountdown(null);
  }, []);

  const getComposedPreview = useCallback(() => {
    const committed = committedSegmentsRef.current.join(" ").trim();
    const interim = interimTextRef.current.trim();
    return [committed, interim].filter(Boolean).join(" ").trim();
  }, []);

  const restartRecognitionIfHeld = useCallback(() => {
    if (!ctrlHeldRef.current || !recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      recognitionLiveRef.current = true;
      setIsRecording(true);
      setBubbleMode("listening");
      setBubbleText(getComposedPreview() || "正在倾听...");
    } catch {
      // ignore restart race
    }
  }, [getComposedPreview]);

  useEffect(() => {
    const nextSettings: PersistedSettings = {
      enabled,
      speechEnabled,
      autoSpeakEnabled,
      autoSendEnabled,
      language,
      selectedVoice,
      rate,
      volume,
    };
    if (typeof window !== "undefined") {
      persistSettings(nextSettings);
    }
  }, [enabled, speechEnabled, autoSpeakEnabled, autoSendEnabled, language, selectedVoice, rate, volume]);

  useEffect(() => {
    const synth = synthRef.current;
    if (!synth) return;
    const updateVoices = () => {
      const next = synth.getVoices().map((voice) => ({ name: voice.name, lang: voice.lang }));
      setVoices(next);
      if (!selectedVoice && next.length > 0) {
        const preferred =
          next.find((voice) => voice.lang.toLowerCase().startsWith(language.toLowerCase().split("-")[0])) ?? next[0];
        setSelectedVoiceState(preferred.name);
      }
    };
    updateVoices();
    synth.onvoiceschanged = updateVoices;
    return () => {
      synth.onvoiceschanged = null;
    };
  }, [language, selectedVoice]);

  const supportedRecognition =
    typeof window !== "undefined" && Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition);
  const supportedSpeech = typeof window !== "undefined" && Boolean(window.speechSynthesis);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const speakText = useCallback(
    (text: string) => {
      if (!supportedSpeech || !enabled || !speechEnabled) return;
      const cleaned = cleanSpeechText(text);
      if (!cleaned) return;

      stopSpeaking();

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = language;
      utterance.rate = rate;
      utterance.volume = volume;

      const matchedVoice = synthRef.current?.getVoices().find((voice) => voice.name === selectedVoice);
      if (matchedVoice) utterance.voice = matchedVoice;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setErrorMessage("语音播报失败，请检查浏览器语音能力。");
      };

      synthRef.current?.speak(utterance);
    },
    [enabled, language, rate, selectedVoice, speechEnabled, stopSpeaking, supportedSpeech, volume]
  );

  const pauseOrResumeSpeech = useCallback(() => {
    const synth = synthRef.current;
    if (!synth || !isSpeaking) return;
    if (synth.paused) {
      synth.resume();
      setIsPaused(false);
      return;
    }
    synth.pause();
    setIsPaused(true);
  }, [isSpeaking]);

  const commitTranscript = useCallback((text: string, sendImmediately: boolean) => {
    const normalized = normalizeTranscript(text);
    if (!normalized) return;
    onTranscriptRef.current(normalized, sendImmediately);
  }, []);

  const cancelPendingSend = useCallback(() => {
    const pending = pendingTranscriptRef.current.trim();
    if (!pending) return;
    clearPendingTimers();
    commitTranscript(pending, false);
    pendingTranscriptRef.current = "";
    setBubbleMode("holding");
    setBubbleText("已取消自动发送，识别内容已写入输入框");
    window.setTimeout(() => {
      resetBubble();
    }, 1200);
  }, [clearPendingTimers, commitTranscript, resetBubble]);

  const schedulePendingSend = useCallback((text: string) => {
    const normalized = ensureTrailingPeriod(normalizeTranscript(text));
    if (!normalized) {
      resetBubble();
      return;
    }

    pendingTranscriptRef.current = normalized;
    setBubbleMode("confirming");
    setBubbleText(normalized);
    setPendingCountdown(3);
    clearPendingTimers();

    pendingCountdownIntervalRef.current = window.setInterval(() => {
      setPendingCountdown((prev) => {
        if (prev === null) return prev;
        return prev > 1 ? prev - 1 : 1;
      });
    }, 1000);

    pendingSendTimeoutRef.current = window.setTimeout(() => {
      const pending = pendingTranscriptRef.current.trim();
      clearPendingTimers();
      pendingTranscriptRef.current = "";
      resetBubble();
      if (!pending) return;
      commitTranscript(pending, true);
    }, AUTO_SEND_DELAY_MS);
  }, [clearPendingTimers, commitTranscript, resetBubble]);

  const ensureRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current;
    const recognition = createRecognition();
    if (!recognition) return null;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event) => {
      let finalChunk = "";
      let interimChunk = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const piece = result?.[0]?.transcript ?? "";
        if (!piece) continue;
        if (result.isFinal) {
          finalChunk += piece;
        } else {
          interimChunk += piece;
        }
      }

      if (finalChunk.trim()) {
        committedSegmentsRef.current.push(ensureTrailingComma(normalizeTranscript(finalChunk)));
      }
      interimTextRef.current = normalizeTranscript(interimChunk);

      const preview = getComposedPreview();
      setBubbleMode("listening");
      setBubbleText(preview || "正在倾听...");
    };

    recognition.onerror = (event) => {
      recognitionLiveRef.current = false;
      setIsRecording(false);
      clearCtrlHoldTimer();
      setErrorMessage(`语音识别失败：${event.error}`);
      if (ctrlHeldRef.current) {
        window.setTimeout(restartRecognitionIfHeld, 180);
        return;
      }
      if (!pendingTranscriptRef.current) {
        resetBubble();
      }
    };

    recognition.onend = () => {
      recognitionLiveRef.current = false;
      setIsRecording(false);
      clearCtrlHoldTimer();

      if (ctrlHeldRef.current) {
        // While Ctrl is still held, continue listening instead of scheduling send.
        interimTextRef.current = "";
        window.setTimeout(restartRecognitionIfHeld, 160);
        return;
      }

      const finalText = ensureTrailingPeriod(getComposedPreview());
      committedSegmentsRef.current = [];
      interimTextRef.current = "";

      if (!finalText) {
        resetBubble();
        return;
      }

      schedulePendingSend(finalText);
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [clearCtrlHoldTimer, getComposedPreview, language, resetBubble, restartRecognitionIfHeld, schedulePendingSend]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  const startRecording = useCallback(() => {
    if (!enabled) {
      setErrorMessage("请先开启语音总开关。");
      return false;
    }
    const recognition = ensureRecognition();
    if (!recognition) {
      setErrorMessage("当前浏览器不支持语音识别，请使用 Chrome 或 Edge。");
      return false;
    }
    if (recognitionLiveRef.current) return true;

    clearPendingTimers();
    pendingTranscriptRef.current = "";
    committedSegmentsRef.current = [];
    interimTextRef.current = "";
    setErrorMessage(null);
    setBubbleMode("listening");
    setBubbleText("正在倾听...");

    try {
      recognition.start();
      recognitionLiveRef.current = true;
      setIsRecording(true);
      return true;
    } catch {
      recognitionLiveRef.current = false;
      setIsRecording(false);
      resetBubble();
      setErrorMessage("语音识别启动失败，请确认麦克风权限已开启。");
      return false;
    }
  }, [clearPendingTimers, enabled, ensureRecognition, resetBubble]);

  const stopRecording = useCallback(() => {
    ctrlHeldRef.current = false;
    if (recognitionRef.current && recognitionLiveRef.current) {
      recognitionRef.current.stop();
      recognitionLiveRef.current = false;
    } else {
      const finalText = ensureTrailingPeriod(getComposedPreview());
      committedSegmentsRef.current = [];
      interimTextRef.current = "";
      if (!finalText) {
        resetBubble();
        return;
      }
      schedulePendingSend(finalText);
    }
    setIsRecording(false);
    clearCtrlHoldTimer();
  }, [clearCtrlHoldTimer, getComposedPreview, resetBubble, schedulePendingSend]);

  const toggleRecording = useCallback(() => {
    if (isRecording || recognitionLiveRef.current) {
      stopRecording();
      return;
    }
    ctrlHeldRef.current = true;
    void startRecording();
  }, [isRecording, startRecording, stopRecording]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (bubbleMode === "confirming") {
        if (event.code === "Space" || event.key === " " || event.key === "Spacebar" || event.keyCode === 32) {
          event.preventDefault();
          event.stopPropagation();
          cancelPendingSend();
          return;
        }
      }

      if (!enabled) return;
      if (event.repeat) return;

      if (event.key === "Control" && !ctrlHeldRef.current) {
        if (canStartPushToTalkRef.current && !canStartPushToTalkRef.current()) return;
        ctrlHeldRef.current = true;
        clearCtrlHoldTimer();
        ctrlHoldTimerRef.current = window.setTimeout(() => {
          ctrlHoldTimerRef.current = null;
          if (!ctrlHeldRef.current) return;
          void startRecording();
        }, CTRL_HOLD_DELAY_MS);
        return;
      }

      if (ctrlHeldRef.current && event.key !== "Control") {
        clearCtrlHoldTimer();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key !== "Control") return;
      if (!ctrlHeldRef.current) return;

      event.preventDefault();
      event.stopPropagation();
      stopRecording();
    };

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("keyup", onKeyUp, true);
    return () => {
      clearCtrlHoldTimer();
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("keyup", onKeyUp, true);
    };
  }, [bubbleMode, cancelPendingSend, clearCtrlHoldTimer, enabled, startRecording, stopRecording]);

  const toggleEnabled = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (!next) {
        ctrlHeldRef.current = false;
        recognitionRef.current?.stop();
        recognitionLiveRef.current = false;
        clearCtrlHoldTimer();
        clearPendingTimers();
        pendingTranscriptRef.current = "";
        committedSegmentsRef.current = [];
        interimTextRef.current = "";
        setIsRecording(false);
        resetBubble();
        stopSpeaking();
      }
      return next;
    });
  }, [clearCtrlHoldTimer, clearPendingTimers, resetBubble, stopSpeaking]);

  const toggleSpeechEnabled = useCallback(() => {
    setSpeechEnabled((prev) => {
      const next = !prev;
      if (!next) stopSpeaking();
      return next;
    });
  }, [stopSpeaking]);

  const clearError = useCallback(() => setErrorMessage(null), []);

  return {
    enabled,
    isRecording,
    speechEnabled,
    isSpeaking,
    isPaused,
    autoSpeakEnabled,
    autoSendEnabled,
    language,
    selectedVoice,
    rate,
    volume,
    supportedRecognition,
    supportedSpeech,
    errorMessage,
    voices,
    bubbleMode,
    bubbleText,
    pendingCountdown,
    toggleEnabled,
    toggleRecording,
    toggleSpeechEnabled,
    toggleAutoSpeak: () => setAutoSpeakEnabled((prev) => !prev),
    toggleAutoSend: () => setAutoSendEnabled((prev) => !prev),
    setLanguage: setLanguageState,
    setSelectedVoice: setSelectedVoiceState,
    setRate: setRateState,
    setVolume: setVolumeState,
    speakText,
    pauseOrResumeSpeech,
    stopSpeaking,
    cancelPendingSend,
    clearError,
  };
}
