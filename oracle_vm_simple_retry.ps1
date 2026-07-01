# =============================================================
# ORACLE ARM VM - RETRY SIMPLE Y EFECTIVO
# Para Leo - ejecutar directamente en PowerShell
# 
# ESTRATEGIA: Oracle recomienda NO especificar fault domain.
# Intenta cada 2 minutos, alternando configs 4/24, 2/12, 1/6.
# Usa archivo temporal para shape-config (evita problemas JSON/PS)
# =============================================================

$ErrorActionPreference = "Continue"

$AD = "zUjk:EU-MADRID-1-AD-1"
$COMPARTMENT = "ocid1.tenancy.oc1..aaaaaaaaiu2fvxpr4pxfnfxxufyd3gzxvxkl4u2oyyre3wzud3taf6jumhfq"
$IMAGE = "ocid1.image.oc1.eu-madrid-1.aaaaaaaa7rcvdaff45ybwthn46rkimr42mvzrdyfssah5rtwommnlnruna5q"
$SUBNET = "ocid1.subnet.oc1.eu-madrid-1.aaaaaaaa2hdkdrnvduxvoz7iyehvyv27ud6fq74ikzppqnti7dkfz56rdvsq"
$SSH_KEY = "C:\Users\User\.oci\ssh_key.pub"

$attempt = 0

$configOcpus = @(4, 2, 1)
$configMem = @(24, 12, 6)

Write-Host ""
Write-Host "=== ORACLE ARM RETRY - eu-madrid-1 ===" -ForegroundColor Cyan
Write-Host "Inicio: $(Get-Date)" -ForegroundColor Cyan
Write-Host "Ctrl+C para detener" -ForegroundColor Gray
Write-Host ""

while ($true) {
    $attempt++
    $configIdx = ($attempt - 1) % 3
    $ocpus = $configOcpus[$configIdx]
    $mem = $configMem[$configIdx]
    
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] #$attempt - $ocpus OCPU / ${mem}GB" -ForegroundColor Yellow
    
    # Escribir JSON a archivo temporal (metodo mas confiable para OCI CLI + PowerShell)
    $jsonContent = '{"ocpus":' + $ocpus + ',"memoryInGBs":' + $mem + '}'
    [System.IO.File]::WriteAllText("C:\Users\User\oci_tmp_shape.json", $jsonContent)
    
    # Usar file:// para pasar el JSON desde archivo
    $result = & oci compute instance launch `
        --availability-domain $AD `
        --compartment-id $COMPARTMENT `
        --shape "VM.Standard.A1.Flex" `
        --shape-config "file://C:\Users\User\oci_tmp_shape.json" `
        --image-id $IMAGE `
        --subnet-id $SUBNET `
        --display-name "reactor-oracle" `
        --assign-public-ip true `
        --ssh-authorized-keys-file $SSH_KEY 2>&1 | Out-String

    if ($result -match "lifecycle-state") {
        Write-Host "" -ForegroundColor Green
        Write-Host "===== VM CREADA! =====" -ForegroundColor Green
        Write-Host $result -ForegroundColor Green
        $result | Out-File "C:\Users\User\oracle_vm_created.json" -Encoding UTF8
        Write-Host "Guardado en C:\Users\User\oracle_vm_created.json" -ForegroundColor Green
        [console]::beep(1000,500); [console]::beep(1500,500); [console]::beep(2000,500)
        break
    }
    elseif ($result -match "Out of host capacity") {
        Write-Host "  -> Sin stock. Siguiente intento en 120s..." -ForegroundColor Red
        Start-Sleep -Seconds 120
    }
    elseif ($result -match "TooManyRequests") {
        Write-Host "  -> Rate limited! Esperando 300s..." -ForegroundColor DarkYellow
        Start-Sleep -Seconds 300
    }
    elseif ($result -match "LimitExceeded") {
        Write-Host "  -> LIMITE ALCANZADO - ya tienes instancia A1!" -ForegroundColor Red
        break
    }
    elseif ($result -match "must be in JSON format") {
        Write-Host "  -> Error JSON. Probando metodo alternativo..." -ForegroundColor DarkYellow
        # Fallback: usar --from-json con todo el comando
        # Intentar con escape directo que funciono en la terminal de Leo
        $shapeArg = '{\"ocpus\":' + $ocpus + ',\"memoryInGBs\":' + $mem + '}'
        $result2 = & oci compute instance launch `
            --availability-domain $AD `
            --compartment-id $COMPARTMENT `
            --shape "VM.Standard.A1.Flex" `
            --shape-config $shapeArg `
            --image-id $IMAGE `
            --subnet-id $SUBNET `
            --display-name "reactor-oracle" `
            --assign-public-ip true `
            --ssh-authorized-keys-file $SSH_KEY 2>&1 | Out-String
        
        if ($result2 -match "lifecycle-state") {
            Write-Host "===== VM CREADA! =====" -ForegroundColor Green
            Write-Host $result2 -ForegroundColor Green
            $result2 | Out-File "C:\Users\User\oracle_vm_created.json" -Encoding UTF8
            [console]::beep(1000,500); [console]::beep(1500,500); [console]::beep(2000,500)
            break
        }
        elseif ($result2 -match "Out of host capacity") {
            Write-Host "  -> Sin stock (fallback). Siguiente en 120s..." -ForegroundColor Red
            Start-Sleep -Seconds 120
        }
        else {
            Write-Host "  -> Error fallback: $($result2.Substring(0, [Math]::Min(150, $result2.Length)))" -ForegroundColor DarkRed
            Start-Sleep -Seconds 120
        }
    }
    else {
        Write-Host "  -> Error: $($result.Substring(0, [Math]::Min(200, $result.Length)))" -ForegroundColor DarkRed
        Start-Sleep -Seconds 120
    }
}
