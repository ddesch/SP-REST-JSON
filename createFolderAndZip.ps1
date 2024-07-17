param(
    [Parameter(Mandatory=$False)]
    [String]
    $version = "latest" # Default value
)

<#
Call:
.\createFolderAndZip.ps1 <version>
#>

# Create a zip file with the contents of C:\Stuff\
# Compress-Archive -Path C:\Stuff -DestinationPath archive.zip

# Copy files to the $version folder in .\dist
Copy-Item -Path .\src\* -Destination ".\dist\SP-REST-JSON_$($version)\" -Recurse -Force

# Add files to the zip file
# (Existing files in the zip file with the same name are replaced)
# Compress-Archive -Path ".\src\*" -Update -DestinationPath ".\dist\SP-REST-JSON_$($version).zip"
# Compress-Archive -Path ".\dist\SP-REST-JSON_$($version)\*" -Update -DestinationPath ".\dist\SP-REST-JSON_$($version).zip"
Write-Host "Mozilla mag die gezippte Version nicht --> SELBST MANUELL ZIPPEN"
