# Cursor Date-Specific Cache Cleaner
# Clear all cache data up to and including the specified date

param(
    [int]$Day = 20,
    [int]$Month = 6,
    [int]$Year = 2025
)

Write-Host "===== Cursor Date-Specific Cache Cleaner =====" -ForegroundColor Green
Write-Host "Cleaning data up to and including $Year-$Month-$Day" -ForegroundColor Cyan

# Build cutoff time (end of specified day)
try {
    $cutoffDate = Get-Date -Year $Year -Month $Month -Day $Day -Hour 23 -Minute 59 -Second 59
    Write-Host "Cutoff time: $($cutoffDate.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Yellow
} catch {
    Write-Host "Error: Invalid date format" -ForegroundColor Red
    exit 1
}

# Check if Cursor is running
$cursorProcesses = Get-Process -Name "Cursor" -ErrorAction SilentlyContinue
if ($cursorProcesses) {
    Write-Host "Warning: Cursor is running" -ForegroundColor Red
    $response = Read-Host "Force terminate Cursor and continue? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "Terminating Cursor..." -ForegroundColor Yellow
        Stop-Process -Name "Cursor" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "Cursor terminated" -ForegroundColor Green
    } else {
        Write-Host "Cleanup cancelled" -ForegroundColor Red
        exit
    }
}

# Define cleanup paths
$basePaths = @(
    "$env:APPDATA\Cursor",
    "$env:LOCALAPPDATA\Cursor",
    "$env:LOCALAPPDATA\cursor-updater",
    "$env:USERPROFILE\.cursor"
)

# All directories to clean
$allCleanDirs = @(
    "CachedData",
    "GPUCache", 
    "ShaderCache",
    "DawnCache",
    "Code Cache",
    "CachedExtensions",
    "crashDumps",
    "logs",
    "User\logs",
    "User\workspaceStorage",
    "User\globalStorage", 
    "User\History",
    "extensions\logs"
)

$totalCleaned = 0
$totalFiles = 0
$skippedFiles = 0

# Date-based cleaning function
function Clean-ByDate {
    param(
        [string]$dirPath,
        [DateTime]$cutoffDate
    )
    
    if (-not (Test-Path $dirPath)) {
        return @{ Size = 0; Files = 0; Skipped = 0 }
    }
    
    $cleaned = 0
    $files = 0
    $skipped = 0
    
    try {
        Write-Host "    Scanning: $dirPath" -ForegroundColor Gray
        
        # Get all files and directories
        $items = Get-ChildItem $dirPath -Recurse -Force -ErrorAction SilentlyContinue | Sort-Object FullName -Descending
        
        foreach ($item in $items) {
            $itemDate = $item.LastWriteTime
            
            if ($itemDate -le $cutoffDate) {
                try {
                    $size = if ($item.PSIsContainer) { 
                        $childItems = Get-ChildItem $item.FullName -Force -ErrorAction SilentlyContinue
                        if ($childItems.Count -eq 0) {
                            0
                        } else {
                            ($childItems | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
                        }
                    } else { 
                        $item.Length 
                    }
                    
                    Remove-Item $item.FullName -Recurse -Force -ErrorAction SilentlyContinue
                    $cleaned += $size
                    $files++
                    
                    $dateStr = $itemDate.ToString('MM-dd HH:mm')
                    Write-Host "      Deleted: $($item.Name) ($dateStr)" -ForegroundColor Red
                    
                } catch {
                    $skipped++
                    Write-Host "      Skipped: $($item.Name) (delete failed)" -ForegroundColor Yellow
                }
            } else {
                $skipped++
                $dateStr = $itemDate.ToString('MM-dd HH:mm')
                Write-Host "      Kept: $($item.Name) ($dateStr)" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "    Scan failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    return @{ Size = $cleaned; Files = $files; Skipped = $skipped }
}

# Start cleaning
Write-Host "`nStarting date-specific cleanup..." -ForegroundColor Cyan

foreach ($basePath in $basePaths) {
    if (-not (Test-Path $basePath)) {
        Write-Host "Skipping non-existent path: $basePath" -ForegroundColor Gray
        continue
    }
    
    Write-Host "`nProcessing directory: $basePath" -ForegroundColor Cyan
    
    foreach ($dir in $allCleanDirs) {
        $fullPath = Join-Path $basePath $dir
        if (Test-Path $fullPath) {
            Write-Host "  Cleaning: $dir" -ForegroundColor White
            $result = Clean-ByDate -dirPath $fullPath -cutoffDate $cutoffDate
            
            $totalCleaned += $result.Size
            $totalFiles += $result.Files
            $skippedFiles += $result.Skipped
            
            if ($result.Files -gt 0) {
                $sizeStr = [math]::Round($result.Size / 1MB, 2)
                Write-Host "    Completed: $($result.Files) files/dirs, $sizeStr MB" -ForegroundColor Green
            } else {
                Write-Host "    No cleanup needed (no matching files)" -ForegroundColor Gray
            }
        } else {
            Write-Host "  Skipping: $dir (does not exist)" -ForegroundColor Gray
        }
    }
}

# Clean temp files
Write-Host "`nCleaning temp files..." -ForegroundColor Cyan
$tempFiles = Get-ChildItem $env:TEMP -Filter "*cursor*" -Force -ErrorAction SilentlyContinue
$tempCleaned = 0
$tempFiles_count = 0

foreach ($file in $tempFiles) {
    if ($file.LastWriteTime -le $cutoffDate) {
        try {
            $size = if ($file.PSIsContainer) { 
                (Get-ChildItem $file.FullName -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum 
            } else { 
                $file.Length 
            }
            Remove-Item $file.FullName -Recurse -Force -ErrorAction SilentlyContinue
            $tempCleaned += $size
            $tempFiles_count++
            Write-Host "  Deleted: $($file.Name) ($($file.LastWriteTime.ToString('MM-dd HH:mm')))" -ForegroundColor Red
        } catch {
            Write-Host "  Skipped: $($file.Name) (delete failed)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  Kept: $($file.Name) ($($file.LastWriteTime.ToString('MM-dd HH:mm')))" -ForegroundColor Green
    }
}

$totalCleaned += $tempCleaned
$totalFiles += $tempFiles_count

# Display results
Write-Host "`n===== Cleanup Complete =====" -ForegroundColor Green
Write-Host "Date range: Up to $Year-$Month-$Day 23:59:59" -ForegroundColor White
Write-Host "Space freed: $([math]::Round($totalCleaned / 1MB, 2)) MB" -ForegroundColor Yellow
Write-Host "Files deleted: $totalFiles" -ForegroundColor Red
Write-Host "Files kept: $skippedFiles" -ForegroundColor Green
Write-Host "Recommend restarting Cursor for best performance" -ForegroundColor Cyan

# Ask to restart Cursor
$restart = Read-Host "`nStart Cursor now? (y/N)"
if ($restart -eq "y" -or $restart -eq "Y") {
    Write-Host "Starting Cursor..." -ForegroundColor Green
    Start-Process "Cursor" -ErrorAction SilentlyContinue
}

Write-Host "`nCleanup complete! Cursor should run faster now." -ForegroundColor Green 