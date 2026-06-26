#Requires -Version 5.1

[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter()]
    [ValidateNotNullOrEmpty()]
    [string]$DisplayName = 'Tenant Graph',

    [Parameter()]
    [ValidateNotNullOrEmpty()]
    [string]$TenantId,

    [Parameter()]
    [ValidateNotNullOrEmpty()]
    [string[]]$SpaRedirectUri = @('http://localhost:5173'),

    [Parameter()]
    [switch]$GrantAdminConsent,

    [Parameter()]
    [switch]$InstallMissingModules
)

Set-StrictMode -Version 2.0

$GraphApiRoot = 'https://graph.microsoft.com/v1.0'
$MicrosoftGraphAppId = '00000003-0000-0000-c000-000000000000'
$GraphPermissionConfigPath = Join-Path $PSScriptRoot 'src/auth/graphPermissions.json'

if (-not (Test-Path -LiteralPath $GraphPermissionConfigPath)) {
    throw "Could not find Graph permission configuration at '$GraphPermissionConfigPath'."
}

$graphPermissionConfig = Get-Content -LiteralPath $GraphPermissionConfigPath -Raw | ConvertFrom-Json
$graphScopes = @(
    @($graphPermissionConfig.graphReadScopes)
    @($graphPermissionConfig.signInLogScopes)
    @($graphPermissionConfig.conditionalAccessDetailScopes)
) | Where-Object { $_ } | Sort-Object -Unique

function Assert-Module {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Name
    )

    if (Get-Module -ListAvailable -Name $Name) {
        return
    }

    if (-not $InstallMissingModules) {
        throw "Required module '$Name' is not installed. Re-run with -InstallMissingModules or install it manually."
    }

    Install-Module -Name $Name -Scope CurrentUser -Force -AllowClobber -ErrorAction Stop
}

function Escape-ODataString {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Value
    )

    return $Value.Replace("'", "''")
}

function Invoke-GraphJsonRequest {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [ValidateSet('GET', 'POST', 'PATCH')]
        [string]$Method,

        [Parameter(Mandatory)]
        [string]$Uri,

        [Parameter()]
        [object]$Body
    )

    $request = @{
        Method      = $Method
        Uri         = $Uri
        ErrorAction = 'Stop'
    }

    if ($null -ne $Body) {
        $request.Body = $Body | ConvertTo-Json -Depth 20
        $request.ContentType = 'application/json'
    }

    Invoke-MgGraphRequest @request
}

function Get-ResourceServicePrincipal {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$AppId
    )

    $filter = [System.Uri]::EscapeDataString("appId eq '$AppId'")
    $uri = "$GraphApiRoot/servicePrincipals?`$filter=$filter&`$select=id,appId,displayName,oauth2PermissionScopes"
    $servicePrincipal = (Invoke-GraphJsonRequest -Method GET -Uri $uri).value | Select-Object -First 1

    if (-not $servicePrincipal) {
        throw "Could not find service principal for appId '$AppId'."
    }

    return $servicePrincipal
}

function Resolve-DelegatedScope {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [object]$ServicePrincipal,

        [Parameter(Mandatory)]
        [string]$ScopeName
    )

    $scope = @($ServicePrincipal.oauth2PermissionScopes) |
        Where-Object { $_.value -eq $ScopeName -and $_.isEnabled -ne $false } |
        Select-Object -First 1

    if (-not $scope) {
        throw "Scope '$ScopeName' was not found on '$($ServicePrincipal.displayName)'."
    }

    return @{
        id   = $scope.id
        type = 'Scope'
    }
}

function New-RequiredResourceAccess {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [object]$ServicePrincipal,

        [Parameter(Mandatory)]
        [string[]]$ScopeName
    )

    return @{
        resourceAppId  = $ServicePrincipal.appId
        resourceAccess = @($ScopeName | Sort-Object -Unique | ForEach-Object {
            Resolve-DelegatedScope -ServicePrincipal $ServicePrincipal -ScopeName $_
        })
    }
}

function Get-ExistingApplication {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Name
    )

    $escapedName = Escape-ODataString -Value $Name
    $filter = [System.Uri]::EscapeDataString("displayName eq '$escapedName'")
    $uri = "$GraphApiRoot/applications?`$filter=$filter&`$select=id,appId,displayName"
    $matches = @((Invoke-GraphJsonRequest -Method GET -Uri $uri).value)

    if ($matches.Count -gt 1) {
        throw "Found multiple applications named '$Name'. Rename one or use a unique DisplayName."
    }

    return $matches | Select-Object -First 1
}

function Get-OrCreateServicePrincipal {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$AppId
    )

    $filter = [System.Uri]::EscapeDataString("appId eq '$AppId'")
    $uri = "$GraphApiRoot/servicePrincipals?`$filter=$filter&`$select=id,appId,displayName"
    $existing = (Invoke-GraphJsonRequest -Method GET -Uri $uri).value | Select-Object -First 1

    if ($existing) {
        return $existing
    }

    if ($PSCmdlet.ShouldProcess($AppId, 'Create enterprise application service principal')) {
        return Invoke-GraphJsonRequest -Method POST -Uri "$GraphApiRoot/servicePrincipals" -Body @{
            appId = $AppId
        }
    }

    return $null
}

function Set-DelegatedAdminConsent {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$ClientServicePrincipalId,

        [Parameter(Mandatory)]
        [object]$ResourceServicePrincipal,

        [Parameter(Mandatory)]
        [string[]]$ScopeName
    )

    $filter = [System.Uri]::EscapeDataString(
        "clientId eq '$ClientServicePrincipalId' and resourceId eq '$($ResourceServicePrincipal.id)' and consentType eq 'AllPrincipals'"
    )
    $uri = "$GraphApiRoot/oauth2PermissionGrants?`$filter=$filter&`$select=id,clientId,resourceId,scope,consentType"
    $existingGrant = (Invoke-GraphJsonRequest -Method GET -Uri $uri).value | Select-Object -First 1
    $requestedScopes = @($ScopeName | Sort-Object -Unique)

    if ($existingGrant) {
        $currentScopes = if ($existingGrant.scope) { @($existingGrant.scope -split ' ' | Where-Object { $_ }) } else { @() }
        $mergedScope = @($currentScopes + $requestedScopes | Sort-Object -Unique) -join ' '

        if ($PSCmdlet.ShouldProcess($ResourceServicePrincipal.displayName, 'Update delegated admin consent')) {
            Invoke-GraphJsonRequest -Method PATCH -Uri "$GraphApiRoot/oauth2PermissionGrants/$($existingGrant.id)" -Body @{
                scope = $mergedScope
            } | Out-Null
        }

        return $mergedScope
    }

    $scope = $requestedScopes -join ' '

    if ($PSCmdlet.ShouldProcess($ResourceServicePrincipal.displayName, 'Create delegated admin consent')) {
        Invoke-GraphJsonRequest -Method POST -Uri "$GraphApiRoot/oauth2PermissionGrants" -Body @{
            clientId    = $ClientServicePrincipalId
            consentType = 'AllPrincipals'
            resourceId  = $ResourceServicePrincipal.id
            scope       = $scope
        } | Out-Null
    }

    return $scope
}

Assert-Module -Name 'Microsoft.Graph.Authentication'
Import-Module Microsoft.Graph.Authentication -ErrorAction Stop

$connectScopes = @('Application.ReadWrite.All', 'Directory.Read.All')
if ($GrantAdminConsent) {
    $connectScopes += 'DelegatedPermissionGrant.ReadWrite.All'
}

$connectParameters = @{
    Scopes      = @($connectScopes | Sort-Object -Unique)
    ErrorAction = 'Stop'
}

if ($TenantId) {
    $connectParameters.TenantId = $TenantId
}

if ((Get-Command Connect-MgGraph -ErrorAction Stop).Parameters.ContainsKey('NoWelcome')) {
    $connectParameters.NoWelcome = $true
}

Connect-MgGraph @connectParameters
$context = Get-MgContext

$microsoftGraphSp = Get-ResourceServicePrincipal -AppId $MicrosoftGraphAppId
$requiredResourceAccess = @(
    New-RequiredResourceAccess -ServicePrincipal $microsoftGraphSp -ScopeName $graphScopes
)

$appBody = @{
    displayName            = $DisplayName
    signInAudience         = 'AzureADMultipleOrgs'
    requiredResourceAccess = @($requiredResourceAccess)
    api                    = @{
        requestedAccessTokenVersion = 2
    }
    spa                    = @{
        redirectUris = @($SpaRedirectUri | Sort-Object -Unique)
    }
}

$existingApp = Get-ExistingApplication -Name $DisplayName

if ($existingApp) {
    if ($PSCmdlet.ShouldProcess($DisplayName, 'Update app registration')) {
        $patchBody = $appBody.Clone()
        $patchBody.Remove('displayName')
        Invoke-GraphJsonRequest -Method PATCH -Uri "$GraphApiRoot/applications/$($existingApp.id)" -Body $patchBody | Out-Null
    }

    $application = Invoke-GraphJsonRequest -Method GET -Uri "$GraphApiRoot/applications/$($existingApp.id)?`$select=id,appId,displayName"
}
else {
    if (-not $PSCmdlet.ShouldProcess($DisplayName, 'Create app registration')) {
        return
    }

    $application = Invoke-GraphJsonRequest -Method POST -Uri "$GraphApiRoot/applications" -Body $appBody
}

$clientServicePrincipal = Get-OrCreateServicePrincipal -AppId $application.appId
$grantedScopes = $null

if ($GrantAdminConsent -and $clientServicePrincipal) {
    $grantedScopes = Set-DelegatedAdminConsent `
        -ClientServicePrincipalId $clientServicePrincipal.id `
        -ResourceServicePrincipal $microsoftGraphSp `
        -ScopeName $graphScopes
}

$adminConsentUrlTenant = if ($TenantId) { $TenantId } elseif ($context.TenantId) { $context.TenantId } else { 'organizations' }
$adminConsentRedirectUri = @($SpaRedirectUri | Sort-Object -Unique | Select-Object -First 1)
$adminConsentScope = [System.Uri]::EscapeDataString('https://graph.microsoft.com/.default')
$adminConsentRedirect = [System.Uri]::EscapeDataString($adminConsentRedirectUri)
$adminConsentUrl = "https://login.microsoftonline.com/$adminConsentUrlTenant/v2.0/adminconsent?client_id=$($application.appId)&scope=$adminConsentScope&redirect_uri=$adminConsentRedirect"

[pscustomobject]@{
    DisplayName              = $application.displayName
    ClientId                 = $application.appId
    ApplicationObjectId      = $application.id
    ServicePrincipalObjectId = if ($clientServicePrincipal) { $clientServicePrincipal.id } else { $null }
    TenantId                 = $context.TenantId
    SpaRedirectUris          = @($SpaRedirectUri | Sort-Object -Unique)
    MicrosoftGraphScopes     = @($graphScopes | Sort-Object -Unique)
    AdminConsentGranted      = [bool]$GrantAdminConsent
    AdminConsentUrl          = $adminConsentUrl
    GrantedScopes            = $grantedScopes
}
