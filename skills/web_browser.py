# -*- coding: utf-8 -*-
"""
🎭 WEB BROWSER SKILL — Automatización Web (Playwright)
========================================================
Usa Playwright para:
- Screenshots de URLs
- Scraping inteligente de páginas
- Conversión web → PDF
- Investigación automática
- Monitoreo visual de webs

NOTA: Requiere `playwright` instalado + browsers descargados.
Si no está disponible, usa requests + BeautifulSoup como fallback.
"""

import logging
import tempfile
import os
from typing import Optional, Dict

logger = logging.getLogger("c8l.skills.browser")


class WebBrowserSkill:
    """
    Skill de navegación web con Playwright.
    Fallback a requests si Playwright no está instalado.
    """

    def __init__(self):
        self._playwright_available = self._check_playwright()
        self.action_count = 0

    async def screenshot(self, url: str, full_page: bool = False) -> Optional[bytes]:
        """
        Captura screenshot de una URL.

        Args:
            url: URL a capturar
            full_page: Si captura la página completa

        Returns:
            Bytes PNG del screenshot o None
        """
        if self._playwright_available:
            return await self._playwright_screenshot(url, full_page)
        return None

    async def scrape_text(self, url: str, selector: str = "body") -> Optional[str]:
        """
        Extrae texto de una página web.
        Más potente que requests porque ejecuta JavaScript.
        """
        if self._playwright_available:
            return await self._playwright_scrape(url, selector)
        return self._requests_scrape(url)

    async def page_to_pdf(self, url: str) -> Optional[bytes]:
        """Convierte una página web a PDF."""
        if self._playwright_available:
            return await self._playwright_pdf(url)
        return None

    async def get_page_info(self, url: str) -> Optional[Dict]:
        """Obtiene info básica de una página (título, meta, etc.)."""
        if self._playwright_available:
            return await self._playwright_info(url)
        return self._requests_info(url)

    # --- Playwright implementations ---

    async def _playwright_screenshot(self, url: str,
                                     full_page: bool) -> Optional[bytes]:
        try:
            from playwright.async_api import async_playwright
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page(
                    viewport={"width": 1280, "height": 720}
                )
                await page.goto(url, timeout=15000)
                await page.wait_for_load_state("networkidle")
                screenshot = await page.screenshot(full_page=full_page)
                await browser.close()
                self.action_count += 1
                return screenshot
        except Exception as e:
            logger.error(f"Playwright screenshot error: {e}")
            return None

    async def _playwright_scrape(self, url: str,
                                 selector: str) -> Optional[str]:
        try:
            from playwright.async_api import async_playwright
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                await page.goto(url, timeout=15000)
                await page.wait_for_load_state("domcontentloaded")
                element = await page.query_selector(selector)
                text = await element.inner_text() if element else ""
                await browser.close()
                self.action_count += 1
                return text[:5000] if text else None
        except Exception as e:
            logger.error(f"Playwright scrape error: {e}")
            return None

    async def _playwright_pdf(self, url: str) -> Optional[bytes]:
        try:
            from playwright.async_api import async_playwright
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                await page.goto(url, timeout=15000)
                await page.wait_for_load_state("networkidle")
                pdf_bytes = await page.pdf(format="A4")
                await browser.close()
                self.action_count += 1
                return pdf_bytes
        except Exception as e:
            logger.error(f"Playwright PDF error: {e}")
            return None

    async def _playwright_info(self, url: str) -> Optional[Dict]:
        try:
            from playwright.async_api import async_playwright
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                await page.goto(url, timeout=15000)
                title = await page.title()
                desc = await page.evaluate(
                    """() => {
                        const m = document.querySelector('meta[name="description"]');
                        return m ? m.content : '';
                    }"""
                )
                await browser.close()
                return {"title": title, "description": desc, "url": url}
        except Exception as e:
            logger.error(f"Playwright info error: {e}")
            return None

    # --- Fallback implementations ---

    def _requests_scrape(self, url: str) -> Optional[str]:
        """Scraping básico con requests (sin JS)."""
        try:
            import requests
            r = requests.get(url, timeout=10, headers={
                "User-Agent": "C8L-Bot/1.0"
            })
            if r.status_code == 200:
                # Extraer texto simple
                from html.parser import HTMLParser

                class TextExtractor(HTMLParser):
                    def __init__(self):
                        super().__init__()
                        self.texts = []
                        self._skip = False

                    def handle_starttag(self, tag, attrs):
                        if tag in ("script", "style", "nav", "footer"):
                            self._skip = True

                    def handle_endtag(self, tag):
                        if tag in ("script", "style", "nav", "footer"):
                            self._skip = False

                    def handle_data(self, data):
                        if not self._skip:
                            text = data.strip()
                            if text:
                                self.texts.append(text)

                extractor = TextExtractor()
                extractor.feed(r.text)
                return "\n".join(extractor.texts)[:3000]
        except Exception as e:
            logger.warning(f"Requests scrape error: {e}")
        return None

    def _requests_info(self, url: str) -> Optional[Dict]:
        """Info básica con requests."""
        try:
            import requests
            import re
            r = requests.get(url, timeout=10, headers={
                "User-Agent": "C8L-Bot/1.0"
            })
            if r.status_code == 200:
                title_m = re.search(r'<title>(.*?)</title>', r.text, re.I)
                desc_m = re.search(
                    r'<meta\s+name="description"\s+content="(.*?)"',
                    r.text, re.I
                )
                return {
                    "title": title_m.group(1) if title_m else "",
                    "description": desc_m.group(1) if desc_m else "",
                    "url": url,
                }
        except Exception:
            pass
        return None

    def _check_playwright(self) -> bool:
        """Verifica si Playwright está disponible."""
        try:
            import playwright
            return True
        except ImportError:
            logger.info("Playwright no instalado — usando fallback requests")
            return False
