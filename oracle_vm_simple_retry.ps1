# =============================================================
# ORACLE ARM VM - RETRY SIMPLE Y EFECTIVO
# Para Leo - ejecutar directamente en PowerShell
# 
# ESTRATEGIA: Oracle recomienda NO especificar fault domain
# para que el sistema asigne el mejor disponible.
# Intenta cada 2 minutos, alternando entre 4/24 y 1/6.
# =============================================================

$ErrorActionPreference = "Continue"

$AD = "zUjk:EU-MADRID-1-AD-1"
$COMPARTMENT = "ocid1.tenancy.oc1..aaaaaaaaiu2fvxpr4pxfnfxxufyd3gzxvxkl4u2oyyre3wzud3taf6jumhfq"
$IMAGE = "ocid1.image.oc1.eu-madrid-1.aaaaaaaa7rcvdaff45ybwthn46rkimr42mvzrdyfssah5rtwommnlnruna5q"
$SUBNET = "ocid1.subnet.oc1.eu-madrid-1.aaaaaaaa2hdkdrnvduxvoz7iyehvyv27ud6fq74ikzppqnti7dkfz56rdvsq"
$SSH_KEY = "C:\Users\User\.oci\ssh_key.pub"

$attempt = 0
$configs = @(
    '{"ocpus":4,"memoryInGBs":24}',
    '{"ocpus":2,"memoryInGBs":12}',
    '{"ocpus":1,"memoryInGBs":6}'
)

Write-Host "`n=== ORACLE ARM RETRY - eu-madrid-1 ===" -ForegroundColor Cyan
Write-Host "Inicio: $(Get-Date)" -ForegroundColor Cyan
Write-Host "Ctrl+C para detener`n" -ForegroundColor Gray

while ($true) {
    $attempt++
    $configIdx = ($attempt - 1) % 3
    $shapeConfig = $configs[$configIdx]
    
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] #$attempt - Config: $shapeConfig" -ForegroundColor Yellow
    
    $result = & oci compute instance launch `
        --availability-domain $AD `
        --compartment-id $COMPARTMENT `
        --shape "VM.Standard.A1.Flex" `
        --shape-config $shapeConfig `
        --image-id $IMAGE `
        --subnet-id $SUBNET `
        --display-name "reactor-oracle" `
        --assign-public-ip true `
        --ssh-authorized-keys-file $SSH_KEY 2>&1 | Out-String

    if ($result -match "lifecycle-state") {
        Write-Host "`n`n===== VM CREADA! =====" -ForegroundColor Green
        Write-Host $result -ForegroundColor Green
        $result | Out-File "C:\Users\User\oracle_vm_created.json" -Encoding UTF8
        Write-Host "`nGuardado en C:\Users\User\oracle_vm_created.json" -ForegroundColor Green
        
        # Notificacion sonora
        [console]::beep(1000, 500)
        [console]::beep(1500, 500)
        [console]::beep(2000, 500)
        break
    }
    elseif ($result -match "Out of host capacity") {
        Write-Host "  -> Sin stock. Proximo intento en 120s..." -ForegroundColor Red
        Start-Sleep -Seconds 120
    }
    elseif ($result -match "TooManyRequests") {
        Write-Host "  -> Rate limited! Esperando 300s..." -ForegroundColor DarkYellow
        Start-Sleep -Seconds 300
    }
    elseif ($result -match "LimitExceeded") {
        Write-Host "  -> LIMITE ALCANZADO - ya tienes instancia A1 activa!" -ForegroundColor Red
        Write-Host "  -> Ejecuta: oci compute instance list --compartment-id $COMPARTMENT" -ForegroundColor Yellow
        break
    }
    else {
        Write-Host "  -> Error desconocido: $($result.Substring(0, [Math]::Min(150, $result.Length)))" -ForegroundColor DarkRed
        Start-Sleep -Seconds 120
    }
}
