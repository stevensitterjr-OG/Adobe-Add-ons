$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$PluginRoot = Join-Path $ProjectRoot 'plugin'
$OutputDirectory = Join-Path $ProjectRoot 'dist'
$OutputFile = Join-Path $OutputDirectory 'local-upscale.zip'
$RequiredFiles = @('manifest.json', 'index.html', 'style.css', 'panel.js', 'upscale.js')
$SourceFiles = foreach ($Name in $RequiredFiles) {
    $File = Join-Path $PluginRoot $Name
    if (-not (Test-Path -LiteralPath $File -PathType Leaf)) {
        throw "Missing plugin file: $Name"
    }
    $File
}
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
Compress-Archive -LiteralPath $SourceFiles -DestinationPath $OutputFile -Force
Write-Output "Created $OutputFile"
