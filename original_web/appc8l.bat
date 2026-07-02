@echo off
echo Iniciando servidor local para C8L Agency...
echo POR FAVOR, NO CIERRES ESTA VENTANA MIENTRAS USES LA WEB.
echo.
start /b python -m http.server 8080
timeout /t 3 /nobreak > nul
echo Abriendo navegador en http://localhost:8080...
start http://localhost:8080
pause
