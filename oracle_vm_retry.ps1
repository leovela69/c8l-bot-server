# =============================================================
# ORACLE ARM VM RETRY SCRIPT - reactor-oracle
# Para Leo - c8l project
# Intenta crear VM ARM en eu-madrid-1 con rotacion de Fault Domains
# y reduccion progresiva de recursos si no hay stock
# =============================================================

$ErrorActionPreference = "Continue"

# --- CONFIGURACION ---
$AD = "zUjk:EU-MADRID-1-AD-1"
$COMPARTMENT = "ocid1.tenancy.oc1..aaaaaaaaiu2fvxpr4pxfnfxxufyd3gzxvxkl4u2oyyre3wzud3taf6jumhfq"
$SHAPE = "VM.Standard.A1.Flex"
$IMAGE = "ocid1.image.oc1.eu-madrid-1.aaaaaaaa7rcvdaff45ybwthn46rkimr42mvzrdyfssah5rtwommnlnruna5q"
$SUBNET = "ocid1.subnet.oc1.eu-madrid-1.aaaaaaaa2hdkdrnvduxvoz7iyehvyv27ud6fq74ikzppqnti7dkfz56rdvsq"
$SSH_KEY = "C:\Users\User\.oci\ssh_key.pub"
$DISPLAY_NAME = "reactor-oracle"
$LOG_FILE = "C:\Users\User\oracle_vm_log.txt"

# Fault domains en eu-madrid-1 (3 por AD)
$FAULT_DOMAINS = @(
    "FAULT-DOMAIN-1",
    "FAULT-DOMAIN-2",
    "FAULT-DOMAIN-3"
)

# Configuraciones de tamano (intenta de mayor a menor)
$CONFIGS = @(
    @{ ocpus = 4; memory = 24 },
    @{ ocpus = 2; memory = 12 },
    @{ ocpus = 1; memory = 6 }
)

# Intervalo entre intentos (segundos) - 60s entre fault domains, 180s entre rondas completas
$DELAY_BETWEEN_FD = 60
$DELAY_BETWEEN_ROUNDS = 180
$MAX_ATTEMPTS = 500

# --- FUNCIONES ---
function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logLine = "[$timestamp] $Message"
    Write-Host $logLine -ForegroundColor $Color
    Add-Content -Path $LOG_FILE -Value $logLine
}

function Try-Launch {
    param(
        [int]$Ocpus,
        [int]$Memory,
        [string]$FaultDomain
    )
    
    $shapeConfig = "{`"ocpus`":$Ocpus,`"memoryInGBs`":$Memory}"
    
    Write-Log "Intentando: ${Ocpus} OCPU / ${Memory}GB RAM - FD: $FaultDomain" "Yellow"
    
    # Construir argumentos
    $args_list = @(
        "compute", "instance", "launch",
        "--availability-domain", $AD,
        "--compartment-id", $COMPARTMENT,
        "--shape", $SHAPE,
        "--shape-config", $shapeConfig,
        "--image-id", $IMAGE,
        "--subnet-id", $SUBNET,
        "--display-name", $DISPLAY_NAME,
        "--assign-public-ip", "true",
        "--ssh-authorized-keys-file", $SSH_KEY,
        "--fault-domain", $FaultDomain
    )
    
    try {
        $result = & oci @args_list 2>&1 | Out-String
        
        if ($result -match "lifecycle-state") {
            return @{ Success = $true; Result = $result }
        }
        elseif ($result -match "Out of host capacity") {
            return @{ Success = $false; Error = "OUT_OF_CAPACITY" }
        }
        elseif ($result -match "LimitExceeded") {
            return @{ Success = $false; Error = "LIMIT_EXCEEDED" }
        }
        elseif ($result -match "TooManyRequests") {
            return @{ Success = $false; Error = "TOO_MANY_REQUESTS" }
        }
        else {
            return @{ Success = $false; Error = $result.Substring(0, [Math]::Min(200, $result.Length)) }
        }
    }
    catch {
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

# --- MAIN ---
Write-Log "========================================" "Cyan"
Write-Log "ORACLE ARM VM RETRY - INICIO" "Cyan"
Write-Log "Region: eu-madrid-1 | AD: AD-1" "Cyan"
Write-Log "Subnet: reactor-subnet | VCN: reactor-vcn" "Cyan"
Write-Log "Max intentos: $MAX_ATTEMPTS" "Cyan"
Write-Log "========================================" "Cyan"

$attempt = 0
$configIndex = 0
$created = $false

while ($attempt -lt $MAX_ATTEMPTS -and -not $created) {
    $config = $CONFIGS[$configIndex]
    $ocpus = $config.ocpus
    $memory = $config.memory
    
    Write-Log "--- Ronda con $ocpus OCPU / ${memory}GB (config $($configIndex + 1)/3) ---" "Magenta"
    
    # Intentar cada fault domain
    foreach ($fd in $FAULT_DOMAINS) {
        $attempt++
        Write-Log "Intento #$attempt / $MAX_ATTEMPTS" "White"
        
        $result = Try-Launch -Ocpus $ocpus -Memory $memory -FaultDomain $fd
        
        if ($result.Success) {
            Write-Log "============================================" "Green"
            Write-Log "VM CREADA EXITOSAMENTE!" "Green"
            Write-Log "============================================" "Green"
            Write-Log $result.Result "Green"
            
            # Guardar resultado
            $result.Result | Out-File "C:\Users\User\oracle_vm_created.json" -Encoding UTF8
            Write-Log "Resultado guardado en C:\Users\User\oracle_vm_created.json" "Green"
            
            $created = $true
            break
        }
        else {
            switch ($result.Error) {
                "OUT_OF_CAPACITY" {
                    Write-Log "Sin stock en FD: $fd. Siguiente..." "Red"
                }
                "TOO_MANY_REQUESTS" {
                    Write-Log "Rate limit! Esperando 120s extra..." "DarkYellow"
                    Start-Sleep -Seconds 120
                }
                "LIMIT_EXCEEDED" {
                    Write-Log "Limite excedido - ya tienes una instancia A1 o alcanzaste el maximo." "Red"
                    Write-Log "Verifica: oci compute instance list --compartment-id $COMPARTMENT" "Red"
                    $created = $true  # Salir del loop
                    break
                }
                default {
                    Write-Log "Error: $($result.Error)" "DarkRed"
                }
            }
        }
        
        if (-not $created -and $fd -ne $FAULT_DOMAINS[-1]) {
            Write-Log "Esperando ${DELAY_BETWEEN_FD}s antes de probar siguiente FD..." "Gray"
            Start-Sleep -Seconds $DELAY_BETWEEN_FD
        }
    }
    
    if (-not $created) {
        # Cada 9 intentos (3 rondas completas de 3 FDs), bajar config
        if ($attempt % 9 -eq 0 -and $configIndex -lt 2) {
            $configIndex++
            Write-Log "Bajando recursos a config $($configIndex + 1)..." "DarkYellow"
        }
        # Resetear config index cada 27 intentos para volver a intentar con max
        if ($attempt % 27 -eq 0) {
            $configIndex = 0
            Write-Log "Reseteando a config maxima (4 OCPU/24GB)..." "Cyan"
        }
        
        Write-Log "Esperando ${DELAY_BETWEEN_ROUNDS}s antes de siguiente ronda..." "Gray"
        Start-Sleep -Seconds $DELAY_BETWEEN_ROUNDS
    }
}

if (-not $created) {
    Write-Log "Se alcanzaron $MAX_ATTEMPTS intentos sin exito." "Red"
    Write-Log "Opciones: 1) Upgrade a Pay-As-You-Go, 2) Intentar otra region" "Yellow"
}

Write-Log "Script finalizado." "Cyan"
