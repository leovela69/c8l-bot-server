/**
 * Music IA Engine Routes
 * c.8.l. agency - Project Antigravity
 */

const express = require("express");
const router = express.Router();
const musicController = require("./controller");

// Ruta para la generación asistida de letras
router.post("/lyrics/generate", musicController.generateLyrics);

// Ruta para la generación de la pista de audio con stems e in-painting
router.post("/music/generate", musicController.generateMusicTrack);

module.exports = router;
