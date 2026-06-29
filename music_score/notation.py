"""
🎼 NOTATION — MIDI → Partitura PDF/PNG
========================================
Convierte MIDI a partituras usando:
1. music21 + LilyPond → PDF profesional
2. Fallback: generación propia con reportlab

Requisitos:
  pip install music21
  apt install lilypond  (para PDF de alta calidad)
"""

import os
import logging
import tempfile
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger("c8l.music_score.notation")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCORES_DIR = os.path.join(BASE_DIR, "data", "scores")
os.makedirs(SCORES_DIR, exist_ok=True)



class ScoreGenerator:
    """Genera partituras PDF/PNG desde MIDI"""

    def __init__(self):
        self.generation_count = 0
        self._music21_available = None
        self._lilypond_available = None

    def check_music21(self) -> bool:
        """Verifica si music21 está disponible"""
        if self._music21_available is not None:
            return self._music21_available
        try:
            import music21
            self._music21_available = True
            return True
        except ImportError:
            self._music21_available = False
            return False

    def check_lilypond(self) -> bool:
        """Verifica si LilyPond está instalado"""
        if self._lilypond_available is not None:
            return self._lilypond_available
        import subprocess
        try:
            r = subprocess.run(['lilypond', '--version'],
                             capture_output=True, timeout=5)
            self._lilypond_available = r.returncode == 0
            return self._lilypond_available
        except:
            self._lilypond_available = False
            return False



    def generate_from_midi(self, midi_path: str,
                           title: str = "C8L Score",
                           output_format: str = "pdf") -> Dict:
        """
        Genera partitura desde archivo MIDI.

        Args:
            midi_path: Ruta al archivo MIDI
            title: Título de la partitura
            output_format: "pdf" o "png"

        Returns:
            Dict con path al archivo, bytes, metadata
        """
        if not os.path.exists(midi_path):
            return {'status': 'error', 'error': f'MIDI no encontrado: {midi_path}'}

        # Intentar music21 + LilyPond
        if self.check_music21():
            result = self._generate_music21(midi_path, title, output_format)
            if result.get('status') == 'success':
                self.generation_count += 1
                return result

        # Fallback: generar con texto ASCII + PDF básico
        result = self._generate_text_score(midi_path, title)
        self.generation_count += 1
        return result

    def generate_from_notes(self, notes: List[Dict],
                            title: str = "C8L Score",
                            key: str = "C",
                            time_sig: str = "4/4",
                            tempo: int = 120) -> Dict:
        """
        Genera partitura desde lista de notas.

        Args:
            notes: Lista de {pitch, duration, start}
            title: Título
            key: Tonalidad (C, D, Em, etc.)
            time_sig: Compás (4/4, 3/4, 6/8)
            tempo: BPM
        """
        if self.check_music21():
            return self._generate_from_notes_music21(
                notes, title, key, time_sig, tempo)
        return self._generate_from_notes_text(
            notes, title, key, time_sig, tempo)



    def _generate_music21(self, midi_path: str, title: str,
                           output_format: str) -> Dict:
        """Genera partitura con music21 + LilyPond"""
        try:
            import music21
            from music21 import converter, metadata

            # Cargar MIDI
            score = converter.parse(midi_path)

            # Añadir metadata
            score.metadata = metadata.Metadata()
            score.metadata.title = title
            score.metadata.composer = "C8L Agency"

            # Generar salida
            output_name = f"score_{int(datetime.now().timestamp())}"
            output_path = os.path.join(SCORES_DIR, f"{output_name}.{output_format}")

            if self.check_lilypond() and output_format == 'pdf':
                # Usar LilyPond para PDF de alta calidad
                lp = music21.lily.translate.LilypondConverter()
                lp_text = lp.textFromMusic21Object(score)
                output_path = self._render_lilypond(lp_text, output_name)
            else:
                # Usar music21 show (genera PNG/PDF si tiene backend)
                try:
                    score.write(output_format, fp=output_path)
                except Exception:
                    # Si no puede escribir directamente, generar MusicXML
                    xml_path = os.path.join(SCORES_DIR, f"{output_name}.xml")
                    score.write('musicxml', fp=xml_path)
                    output_path = xml_path
                    output_format = 'xml'

            if os.path.exists(output_path):
                with open(output_path, 'rb') as f:
                    content = f.read()

                # Extraer info musical
                key_sig = score.analyze('key')
                time_sig = score.recurse().getElementsByClass(
                    'TimeSignature')

                return {
                    'status': 'success',
                    'path': output_path,
                    'bytes': content,
                    'format': output_format,
                    'method': 'music21',
                    'title': title,
                    'key': str(key_sig) if key_sig else 'Unknown',
                    'measures': len(score.parts[0].getElementsByClass(
                        'Measure')) if score.parts else 0,
                    'size_kb': round(len(content) / 1024, 1)
                }
            else:
                return {'status': 'error', 'error': 'No se generó archivo'}

        except Exception as e:
            logger.error(f"music21 error: {e}")
            return {'status': 'error', 'error': str(e), 'method': 'music21'}



    def _render_lilypond(self, lilypond_text: str,
                          output_name: str) -> str:
        """Renderiza LilyPond a PDF"""
        import subprocess

        ly_path = os.path.join(SCORES_DIR, f"{output_name}.ly")
        pdf_path = os.path.join(SCORES_DIR, f"{output_name}.pdf")

        with open(ly_path, 'w') as f:
            f.write(lilypond_text)

        try:
            subprocess.run(
                ['lilypond', '-o', os.path.join(SCORES_DIR, output_name),
                 ly_path],
                capture_output=True, timeout=60
            )
        except Exception as e:
            logger.warning(f"LilyPond render error: {e}")

        return pdf_path if os.path.exists(pdf_path) else ly_path

    def _generate_from_notes_music21(self, notes: List[Dict],
                                      title: str, key: str,
                                      time_sig: str, tempo: int) -> Dict:
        """Genera partitura desde notas con music21"""
        try:
            from music21 import stream, note, meter, key as m21key
            from music21 import tempo as m21tempo, metadata

            # Crear score
            s = stream.Score()
            s.metadata = metadata.Metadata()
            s.metadata.title = title
            s.metadata.composer = "C8L Agency"

            # Crear parte
            part = stream.Part()
            part.append(m21tempo.MetronomeMark(number=tempo))
            part.append(meter.TimeSignature(time_sig))

            # Mapeo pitch MIDI → nombre de nota
            for n in notes:
                pitch = n.get('pitch', 60)
                dur = n.get('duration', 1.0)

                m21_note = note.Note(pitch)
                m21_note.quarterLength = dur
                part.append(m21_note)

            s.append(part)

            # Generar
            output_name = f"score_{int(datetime.now().timestamp())}"
            output_path = os.path.join(SCORES_DIR, f"{output_name}.pdf")

            try:
                s.write('lily.pdf', fp=output_path)
            except:
                xml_path = os.path.join(SCORES_DIR, f"{output_name}.xml")
                s.write('musicxml', fp=xml_path)
                output_path = xml_path

            if os.path.exists(output_path):
                with open(output_path, 'rb') as f:
                    content = f.read()
                return {
                    'status': 'success',
                    'path': output_path,
                    'bytes': content,
                    'format': os.path.splitext(output_path)[1][1:],
                    'method': 'music21_from_notes',
                    'title': title,
                    'notes_count': len(notes)
                }

            return {'status': 'error', 'error': 'No se generó salida'}

        except Exception as e:
            logger.error(f"music21 from_notes error: {e}")
            return {'status': 'error', 'error': str(e)}



    def _generate_text_score(self, midi_path: str, title: str) -> Dict:
        """
        Fallback: genera partitura como texto/PDF básico
        cuando music21/LilyPond no están disponibles.
        """
        try:
            # Leer MIDI básico y generar representación texto
            notes = self._read_midi_basic(midi_path)
            return self._generate_from_notes_text(
                notes, title, 'C', '4/4', 120)
        except Exception as e:
            return {'status': 'error', 'error': str(e)}

    def _generate_from_notes_text(self, notes: List[Dict],
                                   title: str, key: str,
                                   time_sig: str, tempo: int) -> Dict:
        """Genera partitura como PDF con fpdf2"""
        try:
            from fpdf import FPDF
            from fpdf.enums import XPos, YPos

            # Mapeo MIDI → nombre de nota
            NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F',
                         'F#', 'G', 'G#', 'A', 'A#', 'B']

            pdf = FPDF()
            pdf.add_page()
            pdf.set_auto_page_break(auto=True, margin=15)

            # Header
            pdf.set_font("Helvetica", "B", 24)
            pdf.cell(0, 15, title, new_x=XPos.LMARGIN,
                    new_y=YPos.NEXT, align="C")
            pdf.set_font("Helvetica", "I", 12)
            pdf.cell(0, 8, "C8L Agency - Music Score",
                    new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
            pdf.ln(5)

            # Info musical
            pdf.set_font("Helvetica", "", 11)
            pdf.cell(0, 7, f"Key: {key} | Time: {time_sig} | "
                    f"Tempo: {tempo} BPM | Notes: {len(notes)}",
                    new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
            pdf.ln(10)

            # Notas en formato de texto
            pdf.set_font("Courier", "B", 10)
            pdf.cell(0, 6, "NOTATION:",
                    new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.ln(3)
            pdf.set_font("Courier", "", 9)

            # Agrupar por compás (4 beats)
            beats_per_measure = int(time_sig.split('/')[0])
            current_beat = 0
            measure_num = 1
            line = f"  |{measure_num:3d}| "

            for n in notes[:200]:  # Máx 200 notas
                pitch = n.get('pitch', 60)
                dur = n.get('duration', 1.0)

                note_name = NOTE_NAMES[pitch % 12]
                octave = (pitch // 12) - 1

                # Duración como fracción
                if dur >= 4:
                    dur_str = "w"  # whole
                elif dur >= 2:
                    dur_str = "h"  # half
                elif dur >= 1:
                    dur_str = "q"  # quarter
                elif dur >= 0.5:
                    dur_str = "e"  # eighth
                else:
                    dur_str = "s"  # sixteenth

                line += f"{note_name}{octave}{dur_str} "
                current_beat += dur

                if current_beat >= beats_per_measure:
                    pdf.multi_cell(0, 5, line)
                    current_beat = 0
                    measure_num += 1
                    line = f"  |{measure_num:3d}| "

            # Última línea
            if line.strip() != f"|{measure_num:3d}|":
                pdf.multi_cell(0, 5, line + "|")

            # Footer
            pdf.ln(10)
            pdf.set_font("Helvetica", "I", 8)
            pdf.cell(0, 6, f"Generated by C8L Bot - {datetime.now().strftime('%d/%m/%Y %H:%M')}",
                    new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
            pdf.cell(0, 6, "w=whole h=half q=quarter e=eighth s=sixteenth",
                    new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")

            # Guardar
            output_name = f"score_{int(datetime.now().timestamp())}"
            output_path = os.path.join(SCORES_DIR, f"{output_name}.pdf")
            pdf.output(output_path)

            with open(output_path, 'rb') as f:
                content = f.read()

            return {
                'status': 'success',
                'path': output_path,
                'bytes': content,
                'format': 'pdf',
                'method': 'text_pdf',
                'title': title,
                'notes_count': len(notes),
                'measures': measure_num,
                'size_kb': round(len(content) / 1024, 1)
            }

        except ImportError:
            # Sin fpdf2, devolver texto plano
            return self._generate_plain_text(notes, title, key, time_sig, tempo)
        except Exception as e:
            logger.error(f"Text score error: {e}")
            return {'status': 'error', 'error': str(e)}

    def _generate_plain_text(self, notes: List[Dict], title: str,
                              key: str, time_sig: str, tempo: int) -> Dict:
        """Último fallback: texto plano"""
        NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F',
                     'F#', 'G', 'G#', 'A', 'A#', 'B']

        lines = [
            f"{'='*40}",
            f"  {title}",
            f"  C8L Agency - Music Score",
            f"{'='*40}",
            f"  Key: {key} | Time: {time_sig} | Tempo: {tempo}",
            f"  Notes: {len(notes)}",
            f"{'='*40}",
            ""
        ]

        for i, n in enumerate(notes[:100]):
            pitch = n.get('pitch', 60)
            note_name = NOTE_NAMES[pitch % 12]
            octave = (pitch // 12) - 1
            lines.append(f"  {i+1:3d}. {note_name}{octave} "
                        f"(dur: {n.get('duration', 1.0):.2f})")

        text = "\n".join(lines)
        content = text.encode('utf-8')

        output_name = f"score_{int(datetime.now().timestamp())}"
        output_path = os.path.join(SCORES_DIR, f"{output_name}.txt")
        with open(output_path, 'w') as f:
            f.write(text)

        return {
            'status': 'success',
            'path': output_path,
            'bytes': content,
            'format': 'txt',
            'method': 'plain_text',
            'title': title,
            'notes_count': len(notes)
        }

    def _read_midi_basic(self, midi_path: str) -> List[Dict]:
        """Lee notas de un MIDI sin dependencias externas"""
        notes = []
        try:
            import struct
            with open(midi_path, 'rb') as f:
                data = f.read()

            # Parseo MIDI simplificado
            # Buscar eventos Note On (0x90)
            i = 0
            tick = 0
            while i < len(data) - 2:
                if data[i] & 0xF0 == 0x90:  # Note On
                    pitch = data[i + 1]
                    velocity = data[i + 2]
                    if velocity > 0:
                        notes.append({
                            'pitch': pitch,
                            'velocity': velocity,
                            'duration': 1.0,
                            'start': tick * 0.01
                        })
                    i += 3
                else:
                    i += 1
                    tick += 1

        except Exception as e:
            logger.warning(f"Basic MIDI read error: {e}")

        return notes

    def get_status(self) -> Dict:
        return {
            'generation_count': self.generation_count,
            'music21': self.check_music21(),
            'lilypond': self.check_lilypond(),
            'scores_dir': SCORES_DIR
        }
