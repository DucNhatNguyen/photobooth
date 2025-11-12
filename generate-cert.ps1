# Script to generate self-signed SSL certificate for localhost
$certPath = ".\certs"
$certFile = "$certPath\localhost.crt"
$keyFile = "$certPath\localhost.key"

# Create certs directory if it doesn't exist
if (-not (Test-Path $certPath)) {
    New-Item -ItemType Directory -Path $certPath
}

Write-Host "Creating self-signed SSL certificate..." -ForegroundColor Green

# Create self-signed certificate using PowerShell
$cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\LocalMachine\My" -NotAfter (Get-Date).AddYears(1) -KeyAlgorithm RSA -KeyLength 2048

# Export certificate
$certPassword = ConvertTo-SecureString -String "temp" -Force -AsPlainText
$certStorePath = "cert:\LocalMachine\My\$($cert.Thumbprint)"

# Export to PFX file
Export-PfxCertificate -Cert $certStorePath -FilePath ".\certs\localhost.pfx" -Password $certPassword

# Convert to PEM format
Write-Host "Converting certificate to PEM format..." -ForegroundColor Yellow

# Create .crt and .key files from .pfx
$pfxPath = ".\certs\localhost.pfx"

# Use .NET to read PFX and export key/cert
$pfx = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($pfxPath, "temp", [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable)

# Export certificate
$certBytes = $pfx.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
$certPem = "-----BEGIN CERTIFICATE-----`n"
$certPem += [System.Convert]::ToBase64String($certBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
$certPem += "`n-----END CERTIFICATE-----"
Set-Content -Path $certFile -Value $certPem

# Export private key
$rsa = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($pfx)
$keyBytes = $rsa.ExportRSAPrivateKey()
$keyPem = "-----BEGIN RSA PRIVATE KEY-----`n"
$keyPem += [System.Convert]::ToBase64String($keyBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
$keyPem += "`n-----END RSA PRIVATE KEY-----"
Set-Content -Path $keyFile -Value $keyPem

# Cleanup
Remove-Item ".\certs\localhost.pfx"
Remove-Item $certStorePath

Write-Host "SSL certificate created successfully!" -ForegroundColor Green
Write-Host "Files created:" -ForegroundColor Cyan
Write-Host "   - $certFile" -ForegroundColor White
Write-Host "   - $keyFile" -ForegroundColor White
