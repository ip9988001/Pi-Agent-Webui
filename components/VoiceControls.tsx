"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import type { VoiceChatController } from "@/hooks/useVoiceChat";

interface Props {
  controller: VoiceChatController;
}

const buttonBaseStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  height: "100%",
  padding: "0 12px",
  background: "none",
  border: "none",
  borderTop: "2px solid transparent",
  borderRight: "1px solid var(--border)",
  cursor: "pointer",
  color: "var(--text-muted)",
  fontSize: 11,
  whiteSpace: "nowrap",
  transition: "color 0.1s, background 0.1s",
};

export function VoiceControls({ controller }: Props) {
  const [panelOpen, setPanelOpen] = useState(false);

  const {
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
    toggleEnabled,
    toggleRecording,
    toggleSpeechEnabled,
    toggleAutoSpeak,
    toggleAutoSend,
    setLanguage,
    setSelectedVoice,
    setRate,
    setVolume,
    pauseOrResumeSpeech,
    clearError,
  } = controller;

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "stretch", height: "100%" }}>
      <button
        onClick={toggleEnabled}
        title={enabled ? "关闭语音功能" : "开启语音功能"}
        style={{
          ...buttonBaseStyle,
          background: enabled ? "var(--bg-selected)" : "none",
          color: enabled ? "var(--text)" : "var(--text-muted)",
          borderTopColor: enabled ? "var(--accent)" : "transparent",
          fontWeight: enabled ? 600 : 400,
        }}
      >
        <span>语音</span>
      </button>

      <button
        onClick={toggleRecording}
        disabled={!enabled || !supportedRecognition}
        title={!supportedRecognition ? "当前浏览器不支持语音识别" : isRecording ? "停止录音（松开 Ctrl 结束）" : "开始录音（按住 Ctrl）"}
        style={{
          ...buttonBaseStyle,
          color: isRecording ? "#ef4444" : enabled ? "var(--text)" : "var(--text-muted)",
          background: isRecording ? "rgba(239,68,68,0.08)" : "none",
          opacity: !enabled || !supportedRecognition ? 0.55 : 1,
          cursor: !enabled || !supportedRecognition ? "not-allowed" : "pointer",
          fontWeight: isRecording ? 600 : 400,
        }}
      >
        <span>{isRecording ? "录音中" : "录音"}</span>
      </button>

      <button
        onClick={toggleSpeechEnabled}
        disabled={!enabled || !supportedSpeech}
        title={!supportedSpeech ? "当前浏览器不支持语音播报" : speechEnabled ? "关闭语音播报" : "开启语音播报"}
        style={{
          ...buttonBaseStyle,
          background: speechEnabled ? "var(--bg-selected)" : "none",
          color: speechEnabled ? "var(--text)" : enabled ? "var(--text-muted)" : "var(--text-dim)",
          opacity: !enabled || !supportedSpeech ? 0.55 : 1,
          cursor: !enabled || !supportedSpeech ? "not-allowed" : "pointer",
          fontWeight: speechEnabled ? 600 : 400,
        }}
      >
        <span>{isSpeaking ? (isPaused ? "继续播报" : "暂停播报") : "播报"}</span>
      </button>

      {isSpeaking && (
        <button
          onClick={pauseOrResumeSpeech}
          title={isPaused ? "继续语音播报" : "暂停语音播报"}
          style={{
            ...buttonBaseStyle,
            color: "var(--text)",
            background: "var(--bg-selected)",
            fontWeight: 600,
          }}
        >
          <span>{isPaused ? "继续" : "暂停"}</span>
        </button>
      )}

      <button
        onClick={() => setPanelOpen((prev) => !prev)}
        title={panelOpen ? "收起语音设置" : "打开语音设置"}
        style={{
          ...buttonBaseStyle,
          background: panelOpen ? "var(--bg-selected)" : "none",
          color: panelOpen ? "var(--text)" : "var(--text-muted)",
          borderTopColor: panelOpen ? "var(--accent)" : "transparent",
          fontWeight: panelOpen ? 600 : 400,
        }}
      >
        <span>设置</span>
      </button>

      {panelOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            zIndex: 520,
            width: 340,
            padding: 12,
            background: "var(--bg-panel)",
            border: "1px solid var(--border)",
            borderTop: "none",
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.6 }}>
            快捷键：<strong style={{ color: "var(--text)" }}>Ctrl 单键</strong>
            <br />
            按住开始录音，松开后进入 3 秒待发送。
            <br />
            待发送时按 <strong style={{ color: "var(--text)" }}>空格</strong> 可取消自动发送并保留到输入框。
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text)" }}>自动播报回复</span>
            <button
              onClick={toggleAutoSpeak}
              style={{
                minWidth: 64,
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: autoSpeakEnabled ? "var(--bg-selected)" : "var(--bg-hover)",
                color: autoSpeakEnabled ? "var(--text)" : "var(--text-muted)",
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              {autoSpeakEnabled ? "开启" : "关闭"}
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text)" }}>常规自动发送</span>
            <button
              onClick={toggleAutoSend}
              style={{
                minWidth: 64,
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: autoSendEnabled ? "var(--bg-selected)" : "var(--bg-hover)",
                color: autoSendEnabled ? "var(--text)" : "var(--text-muted)",
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              {autoSendEnabled ? "开启" : "关闭"}
            </button>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "var(--text)" }}>
            <span>识别语言</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 6,
                background: "var(--bg)",
                color: "var(--text)",
                padding: "6px 8px",
              }}
            >
              <option value="zh-CN">中文（普通话）</option>
              <option value="zh-TW">中文（台湾）</option>
              <option value="en-US">英语（美国）</option>
              <option value="en-GB">英语（英国）</option>
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "var(--text)" }}>
            <span>播报音色</span>
            <select
              value={selectedVoice}
              onChange={(event) => setSelectedVoice(event.target.value)}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 6,
                background: "var(--bg)",
                color: "var(--text)",
                padding: "6px 8px",
              }}
            >
              {voices.length === 0 ? (
                <option value="">当前浏览器未返回可用音色</option>
              ) : (
                voices.map((voice) => (
                  <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                    {voice.name}（{voice.lang}）
                  </option>
                ))
              )}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "var(--text)" }}>
            <span>语速：{rate.toFixed(1)}x</span>
            <input type="range" min="1" max="2.2" step="0.1" value={rate} onChange={(event) => setRate(Number(event.target.value))} />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "var(--text)" }}>
            <span>音量：{Math.round(volume * 100)}%</span>
            <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
          </label>

          {errorMessage && (
            <div
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.22)",
                color: "#ef4444",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              <div>{errorMessage}</div>
              <button
                onClick={clearError}
                style={{
                  marginTop: 6,
                  border: "none",
                  background: "transparent",
                  color: "#ef4444",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 12,
                }}
              >
                知道了
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
