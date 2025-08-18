# Script de respaldo para Red Ciudadana
# Guarda un ZIP con fecha y hora en la misma carpeta donde se ejecuta

$fecha = Get-Date -Format yyyyMMdd_HHmmss
$origen = "C:\Red Ciudadana"
$destino = "C:\Red Ciudadana\respaldo_Red_Ciudadana_$fecha.zip"

Compress-Archive -Path "$origen\*" -DestinationPath $destino -Force

Write-Host "Respaldo creado en: $destino" 