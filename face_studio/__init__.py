"""
🎭 C8L Face Studio — Estudio de Rostros con IA
================================================
Suite completa de herramientas de rostro/cara:

Skills (6):
1. LivePortrait — Animar retratos (foto → video animado)
2. FaceSwap — Cambiar rostros entre imágenes/videos
3. LipSync — Sincronizar labios con audio
4. FaceEnhance — Mejorar/restaurar rostros
5. FaceAge — Envejecer/rejuvenecer
6. FaceExpression — Cambiar expresiones faciales

Providers FREE:
- HuggingFace Spaces (LivePortrait, FaceFusion)
- LatentSync (open source lip sync)
- MuseTalk (open source lip sync)
- Wav2Lip (classic lip sync)
- GFPGAN (face enhancement, open source)

Todo gratuito, $0/mes.
"""

from face_studio.engine import FaceStudio

__all__ = ['FaceStudio']
__version__ = "1.0.0"
