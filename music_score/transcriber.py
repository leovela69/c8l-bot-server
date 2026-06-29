"""
🎵 AUDIO TRANSCRIBER — Audio → MIDI
=====================================
Convierte archivos de audio (MP3/WAV) a MIDI usando:
1. Basic Pitch (Spotify) — mejor precisión, open source
2. Fallback: análisis de frecuencias con librosa

Requisitos:
  pip install basic-pitch librosa soundfile
"""

import os
import logging
import tempfile
from typing import Dict, Optional
from datetime import datetime

logger = logging.getLogger("c8l.music_score.transcriber")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIDI_DIR = os.path.join(BASE_DIR, "data", "midi")
os.makedirs(MIDI_DIR, exist_ok=True)


class AudioTranscriber:
    """Transcribe audio a MIDI"""

    def __init__(self):
        self.transcription_count = 0
        self._basic_pitch_available = None

    def check_basic_pitch(self) -> bool:
        """Verifica si Basic Pitch está disponible"""
        if self._basic_pitch_available is not None:
            return self._basic_pitch_available
        try:
            from basic_pitch.inference import predict
            self._basic_pitch_available = True
            return True
        except ImportError:
            self._basic_pitch_available = False
            return False

    def transcribe(self, audio_path: str, output_path: str = None) -> Dict:
        """
        Transcribe audio a MIDI.

        Args:
            audio_path: Ruta al archivo de audio (MP3/WAV)
            output_path: Ruta de salida para MIDI (opcional)

        Returns:
            Dict con path al MIDI, notas, tempo, etc.
        """
        if not os.path.exists(audio_path):
            return {'status': 'error', 'error': f'Archivo no encontrado: {audio_path}'}

        if not output_path:
            basename = os.path.splitext(os.path.basename(audio_path))[0]
            output_path = os.path.join(MIDI_DIR, f"{basename}_{int(datetime.now().timestamp())}.mid")

        # Intentar Basic Pitch primero
        if self.check_basic_pitch():
            result = self._transcribe_basic_pitch(audio_path, output_path)
            if result.get('status') == 'success':
                self.transcription_count += 1
                return result

        # Fallback: librosa + midiutil
        result = self._transcribe_librosa(audio_path, output_path)
        self.transcription_count += 1
        return result

    def transcribe_from_bytes(self, audio_bytes: bytes,
                              filename: str = "audio.mp3") -> Dict:
        """Transcribe desde bytes (para integración con Telegram)"""
        # Guardar a archivo temporal
        ext = os.path.splitext(filename)[1] or '.mp3'
        tmp = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
        tmp.write(audio_bytes)
        tmp.close()

        try:
            result = self.transcribe(tmp.name)
            return result
        finally:
            try:
                os.unlink(tmp.name)
            except:
                pass

    def _transcribe_basic_pitch(self, audio_path: str,
                                 output_path: str) -> Dict:
        """Transcripción con Basic Pitch (Spotify)"""
        try:
            from basic_pitch.inference import predict
            from basic_pitch import ICASSP_2022_MODEL_PATH

            # Ejecutar predicción
            model_output, midi_data, note_events = predict(
                audio_path,
                onset_threshold=0.5,
                frame_threshold=0.3,
                minimum_note_length=58,
                minimum_frequency=65.0,
                maximum_frequency=2093.0,
            )

            # Guardar MIDI
            midi_data.write(output_path)

            # Extraer información
            notes = []
            for note in note_events:
                notes.append({
                    'start': round(note[0], 3),
                    'end': round(note[1], 3),
                    'pitch': int(note[2]),
                    'velocity': int(note[3] * 127),
                    'duration': round(note[1] - note[0], 3)
                })

            return {
                'status': 'success',
                'midi_path': output_path,
                'method': 'basic_pitch',
                'notes_count': len(notes),
                'notes': notes[:100],  # Primeras 100 para preview
                'duration': max(n['end'] for n in notes) if notes else 0
            }

        except Exception as e:
            logger.error(f"Basic Pitch error: {e}")
            return {'status': 'error', 'error': str(e), 'method': 'basic_pitch'}

    def _transcribe_librosa(self, audio_path: str,
                             output_path: str) -> Dict:
        """Fallback: transcripción con librosa + midiutil"""
        try:
            import librosa
            import numpy as np

            # Cargar audio
            y, sr = librosa.load(audio_path, sr=22050)

            # Detectar tempo
            tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
            if hasattr(tempo, '__len__'):
                tempo = float(tempo[0])
            else:
                tempo = float(tempo)

            # Detectar onset (inicio de notas)
            onset_frames = librosa.onset.onset_detect(y=y, sr=sr)
            onset_times = librosa.frames_to_time(onset_frames, sr=sr)

            # Detectar pitch (frecuencia fundamental)
            pitches, magnitudes = librosa.piptrack(y=y, sr=sr)

            # Extraer notas
            notes = []
            for i, onset in enumerate(onset_times):
                frame = librosa.time_to_frames([onset], sr=sr)[0]
                if frame < pitches.shape[1]:
                    pitch_idx = magnitudes[:, frame].argmax()
                    freq = pitches[pitch_idx, frame]
                    if freq > 0:
                        midi_note = int(librosa.hz_to_midi(freq))
                        duration = 0.25  # Default quarter note
                        if i + 1 < len(onset_times):
                            duration = onset_times[i + 1] - onset

                        notes.append({
                            'start': round(float(onset), 3),
                            'pitch': midi_note,
                            'velocity': 80,
                            'duration': round(float(duration), 3)
                        })

            # Generar MIDI con midiutil
            self._notes_to_midi(notes, output_path, tempo)

            return {
                'status': 'success',
                'midi_path': output_path,
                'method': 'librosa',
                'notes_count': len(notes),
                'notes': notes[:100],
                'tempo': tempo,
                'duration': float(librosa.get_duration(y=y, sr=sr))
            }

        except ImportError as e:
            return {'status': 'error', 'error': f'Dependencia faltante: {e}'}
        except Exception as e:
            logger.error(f"Librosa transcription error: {e}")
            return {'status': 'error', 'error': str(e), 'method': 'librosa'}

    def _notes_to_midi(self, notes: list, output_path: str,
                        tempo: float = 120):
        """Convierte lista de notas a archivo MIDI"""
        try:
            from midiutil import MIDIFile

            midi = MIDIFile(1)
            midi.addTempo(0, 0, tempo)
            midi.addProgramChange(0, 0, 0, 0)  # Piano

            for note in notes:
                beat = note['start'] * (tempo / 60.0)
                duration = note['duration'] * (tempo / 60.0)
                midi.addNote(0, 0, note['pitch'], beat,
                            max(duration, 0.25), note.get('velocity', 80))

            with open(output_path, 'wb') as f:
                midi.writeFile(f)

        except ImportError:
            # Fallback sin midiutil: escribir MIDI básico manualmente
            self._write_basic_midi(notes, output_path, tempo)

    def _write_basic_midi(self, notes: list, output_path: str,
                           tempo: float):
        """Escribe MIDI básico sin dependencias externas"""
        # MIDI file format básico
        import struct

        def var_len(value):
            result = []
            result.append(value & 0x7F)
            value >>= 7
            while value:
                result.append((value & 0x7F) | 0x80)
                value >>= 7
            result.reverse()
            return bytes(result)

        # Header
        header = b'MThd' + struct.pack('>I', 6)
        header += struct.pack('>HHH', 0, 1, 480)  # format, tracks, ticks/beat

        # Track
        track_data = b''
        # Tempo meta event
        us_per_beat = int(60000000 / tempo)
        track_data += b'\x00\xFF\x51\x03'
        track_data += struct.pack('>I', us_per_beat)[1:]

        # Notes
        ticks_per_second = 480 * (tempo / 60.0)
        prev_tick = 0

        for note in sorted(notes, key=lambda n: n['start']):
            tick = int(note['start'] * ticks_per_second)
            dur_ticks = max(int(note['duration'] * ticks_per_second), 120)

            # Note on
            delta = tick - prev_tick
            track_data += var_len(max(0, delta))
            track_data += bytes([0x90, note['pitch'] & 0x7F,
                                note.get('velocity', 80) & 0x7F])

            # Note off
            track_data += var_len(dur_ticks)
            track_data += bytes([0x80, note['pitch'] & 0x7F, 0])
            prev_tick = tick + dur_ticks

        # End of track
        track_data += b'\x00\xFF\x2F\x00'

        track = b'MTrk' + struct.pack('>I', len(track_data)) + track_data

        with open(output_path, 'wb') as f:
            f.write(header + track)
